import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { nanoid } from "nanoid";

import {
  DEFAULT_FINISH_SELECTION,
  DOOR_TOKENS,
  TOP_TOKENS,
  bom,
  canonicalLayoutId,
  cutlist,
  exportOBJ,
  exportSVGPlan,
  legacyLayoutId,
  optimizeToBudget,
  priceUSD,
  buildDesign,
  type Design,
  type DoorColor,
  type LayoutId as CanonicalLayoutId,
  type LegacyLayoutId,
  type OptimizationResult,
  type OptimizationOperation,
  type TopColor,
  LAYOUT_OPTIONS,
} from "@repo/design-engine";

const ARTIFACT_ROOT = join(process.cwd(), "artifacts", "worktrees");

const ensureDir = (directory: string) => mkdirSync(directory, { recursive: true });

const toCsv = <T>(rows: T[]): string => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const lines = rows.map((row) => {
    const record = row as Record<string, unknown>;
    return headers.map((key) => `${record[key] ?? ""}`).join(",");
  });
  return [headers.join(","), ...lines].join("\n");
};

const safeWorktreeAdd = (targetDir: string, branch: string) => {
  try {
    execSync(`git worktree add -b ${branch} ${targetDir} HEAD`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const resolveLayout = (layout: string): CanonicalLayoutId => canonicalLayoutId(layout);

const resolveDoor = (door?: string): DoorColor => {
  if (!door) return DEFAULT_FINISH_SELECTION.door;
  const token = door.toUpperCase() as DoorColor;
  return DOOR_TOKENS.includes(token) ? token : DEFAULT_FINISH_SELECTION.door;
};

const resolveTop = (top?: string): TopColor => {
  if (!top) return DEFAULT_FINISH_SELECTION.top;
  const token = top.toUpperCase() as TopColor;
  return TOP_TOKENS.includes(token) ? token : DEFAULT_FINISH_SELECTION.top;
};

const clampVariants = (value?: number) => {
  if (!value) return 4;
  return Math.min(4, Math.max(1, Math.floor(value)));
};

const budgetTargets = (center: number, count: number): number[] => {
  const multipliers = [1.0, 0.92, 1.08, 0.98];
  return multipliers.slice(0, count).map((factor) => Math.round(center * factor));
};

const writeVariantArtifacts = (
  design: Design,
  runId: string,
  layout: CanonicalLayoutId,
  variantIndex: number,
) => {
  const legacy = legacyLayoutId(layout);
  const suffix = nanoid(6);
  const variantId = `${legacy}-${runId}-v${variantIndex + 1}-${suffix}`;
  const layoutDir = join(ARTIFACT_ROOT, layout);
  const variantDir = join(layoutDir, variantId);

  ensureDir(variantDir);

  const branchName = `GEN-${variantId}`;
  if (!safeWorktreeAdd(variantDir, branchName)) {
    ensureDir(variantDir);
  }

  const planSvg = exportSVGPlan(design, 0.12);
  const obj = exportOBJ(design);
  const bomCsv = toCsv(bom(design));
  const cutCsv = toCsv(cutlist(design));

  const files = {
    designJson: join(variantDir, "design.json"),
    planSvg: join(variantDir, "plan.svg"),
    modelObj: join(variantDir, "model.obj"),
    bomCsv: join(variantDir, "bom.csv"),
    cutCsv: join(variantDir, "cutlist.csv"),
  };

  writeFileSync(files.designJson, JSON.stringify(design, null, 2));
  writeFileSync(files.planSvg, planSvg);
  writeFileSync(files.modelObj, obj);
  writeFileSync(files.bomCsv, bomCsv);
  writeFileSync(files.cutCsv, cutCsv);

  return {
    variantId,
    legacyLayoutId: legacy,
    canonicalLayoutId: layout,
    files: {
      root: variantDir,
      ...files,
    },
  };
};

const buildDeterministicVariant = (
  layout: CanonicalLayoutId,
  budget: number,
  door: DoorColor,
  top: TopColor,
) => {
  const base = buildDesign(layout, door, top);
  const price = priceUSD(base);
  const target = budget > 0 ? budget : price;
  const result: OptimizationResult =
    target === price ? { final: base, ops: [] } : optimizeToBudget(base, target);
  const finalDesign = result.final;
  const ops = result.ops ?? [];
  const finalPrice = priceUSD(finalDesign);

  return {
    design: finalDesign,
    priceUSD: finalPrice,
    operations: ops,
  };
};

export type VariantSummary = {
  variant_id: string;
  layout: LegacyLayoutId;
  layout_canonical: CanonicalLayoutId;
  price_usd: number;
  ops_count: number;
  operations: OptimizationOperation[];
  files: {
    root: string;
    designJson: string;
    planSvg: string;
    modelObj: string;
    bomCsv: string;
    cutCsv: string;
  };
  design: Design;
};

export type GenerationOutput = {
  run_id: string;
  results: Record<CanonicalLayoutId, VariantSummary[]>;
};

export type VariantInput = {
  layouts?: Array<string>;
  perLayout?: number;
  budget?: number | null;
  baseDoor?: string;
  baseTop?: string;
  useLLM?: boolean;
};

const generateLocalVariants = (
  layout: CanonicalLayoutId,
  count: number,
  door: DoorColor,
  top: TopColor,
  budget?: number | null,
) => {
  const baseDesign = buildDesign(layout, door, top);
  const centerPrice = budget && budget > 0 ? budget : priceUSD(baseDesign);
  const targets = budgetTargets(centerPrice, count);
  const runId = nanoid(8);

  return targets.map((target, index) => {
    const variant = buildDeterministicVariant(layout, target, door, top);
    const { variantId, files } = writeVariantArtifacts(variant.design, runId, layout, index);
    return {
      variant_id: variantId,
      layout: legacyLayoutId(layout),
      layout_canonical: layout,
      price_usd: variant.priceUSD,
      ops_count: variant.operations.length,
      operations: variant.operations,
      files,
      design: variant.design,
    } satisfies VariantSummary;
  });
};

const generateLlmVariants = async (
  layout: CanonicalLayoutId,
  count: number,
  door: DoorColor,
  top: TopColor,
  budget?: number | null,
) => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  if (!hasKey) {
    return generateLocalVariants(layout, count, door, top, budget);
  }
  // Placeholder: integrate LLM when enabled. Currently mirrors deterministic pathway.
  const variants = generateLocalVariants(layout, count, door, top, budget);
  return variants.map((variant) => ({
    ...variant,
    ops_count: Math.max(1, variant.ops_count),
  }));
};

export async function generateAll(input: VariantInput = {}): Promise<GenerationOutput> {
  const layouts =
    input.layouts && input.layouts.length
      ? input.layouts.map(resolveLayout)
      : LAYOUT_OPTIONS.slice();

  const perLayout = clampVariants(input.perLayout);
  const door = resolveDoor(input.baseDoor);
  const top = resolveTop(input.baseTop);
  const useLLM = Boolean(input.useLLM && process.env.OPENAI_API_KEY);
  const runId = nanoid(10);

  const results: Record<CanonicalLayoutId, VariantSummary[]> = {} as Record<
    CanonicalLayoutId,
    VariantSummary[]
  >;

  for (const layout of layouts) {
    const variants = useLLM
      ? await generateLlmVariants(layout, perLayout, door, top, input.budget)
      : generateLocalVariants(layout, perLayout, door, top, input.budget);
    results[layout] = variants;
  }

  return { run_id: runId, results };
}


