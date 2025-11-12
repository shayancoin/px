import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import {
  DOOR_FINISH_IDS,
  LAYOUT_IDS,
  LAYOUTS,
  MAX_LAYOUT_SELECTION,
  MIN_LAYOUT_SELECTION,
  VARIANTS_PER_LAYOUT,
  MODULES,
  TOP_FINISH_IDS,
  type FinishSelection,
  type LayoutId,
  type LayoutRoom,
  type ModuleId,
} from "@/domain/spec";
import { calculatePricing } from "@/lib/pricing";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { runWithSemaphore, Semaphore } from "@/lib/concurrency";
import { callGeminiWithSchema } from "@/lib/llm/providers/gemini";

export const runtime = "nodejs";

const layoutIdEnum = z.enum(LAYOUT_IDS as [LayoutId, ...LayoutId[]]);
const doorIdEnum = z.enum(DOOR_FINISH_IDS as [string, ...string[]]);
const topIdEnum = z.enum(TOP_FINISH_IDS as [string, ...string[]]);

const requestSchema = z.object({
  designId: z.string().trim().min(1),
  layouts: z
    .array(layoutIdEnum)
    .min(MIN_LAYOUT_SELECTION)
    .max(MAX_LAYOUT_SELECTION),
  finishes: z.object({
    door: doorIdEnum,
    top: topIdEnum,
  }),
});

const llmPlacementSchema = z.object({
  roomId: z.string().min(1),
  type: z.string().min(1),
  x: z.number(),
  y: z.number(),
  rotation: z.number().optional(),
  option: z.string().optional(),
  note: z.string().optional(),
});

const llmResponseSchema = z.object({
  placements: z.array(llmPlacementSchema).min(1),
  rationale: z.string().min(1),
});

type NormalizedPlacement = {
  roomId: string;
  moduleId: ModuleId;
  x: number;
  y: number;
  rotation?: number;
  option?: string;
  note?: string;
};

type LLMStrategy =
  | "responses-schema"
  | "tool-call+schema"
  | "deterministic-fallback";

type GeneratedVariant = {
  layoutId: LayoutId;
  variantIndex: number;
  variantId: string;
  placements: NormalizedPlacement[];
  rationale: string;
  pricing: ReturnType<typeof calculatePricing>;
  llmStrategy?: LLMStrategy;
};

const SYSTEM_PROMPT = [
  "You are an expert kitchen planner generating production-ready 2D cabinet placements.",
  "Use ONLY the provided modules and do not invent new module IDs.",
  "All coordinates are millimetres with origin at the top-left of the entire plan.",
  "Respect room boundaries and keep cabinets entirely within their assigned rooms.",
  "Maintain minimum aisle width of 900 mm between islands and opposing runs.",
  "Snap placements to a 10 mm grid and align islands parallel to walls.",
  "Return JSON that matches the provided schema exactly—no extra commentary.",
].join(" ");

function buildUserPrompt(
  layout: typeof LAYOUTS[LayoutId],
  variantIndex: number,
  finishes: FinishSelection,
) {
  const roomSummaries = layout.rooms
    .map((room) => {
      const lines = room.placements
        .map(
          (placement) =>
            `• ${placement.moduleId} at x=${placement.x}, y=${placement.y}`,
        )
        .join("\n");
      return [
        `Room ${room.label} (roomId=${room.id})`,
        `  Origin: (${room.origin.x}, ${room.origin.y}) mm`,
        `  Envelope: ${room.width}×${room.depth} mm`,
        `  Baseline placements:`,
        lines,
      ].join("\n");
    })
    .join("\n\n");

  const uniqueModules = Array.from(
    new Set(
      layout.rooms.flatMap((room) =>
        room.placements.map((placement) => placement.moduleId),
      ),
    ),
  );

  const moduleSummaries = uniqueModules
    .map((moduleId) => {
      const moduleSpec = MODULES[moduleId];
      return `- ${moduleSpec.id} (${moduleSpec.label}) → ${moduleSpec.width}×${moduleSpec.depth}×${moduleSpec.height} mm`;
    })
    .join("\n");

  return [
    `Generate variant ${variantIndex + 1} for layout "${layout.name}".`,
    `Door finish token: ${finishes.door}. Countertop token: ${finishes.top}.`,
    "Rules:",
    "- Use each cabinet exactly once unless the baseline uses duplicates.",
    "- Only use the listed module IDs; do not introduce new modules.",
    "- Preserve functional adjacency (fridge near prep, range flanked by worktop, etc.).",
    "- You may micro-adjust positions (±600 mm) to balance flow, but stay within room boundaries.",
    "- If repositioning islands, maintain ≥1100 mm clearance to surrounding runs.",
    "- Prefer aligning cabinet fronts on consistent depth lines.",
    "",
    "Allowed modules:",
    moduleSummaries,
    "",
    "Baseline topology:",
    roomSummaries,
    "",
    "Deliver JSON with placements array (roomId, type, x, y, optional rotation/option/note) and a concise rationale explaining the optimisation.",
  ].join("\n");
}

function createModuleCountMap(
  layout: typeof LAYOUTS[LayoutId],
): Map<ModuleId, number> {
  const map = new Map<ModuleId, number>();
  for (const room of layout.rooms) {
    for (const placement of room.placements) {
      map.set(placement.moduleId, (map.get(placement.moduleId) ?? 0) + 1);
    }
  }
  return map;
}

function normalisePlacements(
  layout: typeof LAYOUTS[LayoutId],
  rawPlacements: z.infer<typeof llmPlacementSchema>[],
): NormalizedPlacement[] {
  const roomMap = new Map<string, LayoutRoom>(
    layout.rooms.map((room) => [room.id, room]),
  );

  const results: NormalizedPlacement[] = [];

  for (const raw of rawPlacements) {
    const moduleId = raw.type.toUpperCase() as ModuleId;
    if (!MODULES[moduleId]) {
      throw new Error(`LLM returned unknown module "${raw.type}".`);
    }

    const room = roomMap.get(raw.roomId);
    if (!room) {
      throw new Error(
        `LLM referenced unknown roomId "${raw.roomId}" for layout ${layout.id}.`,
      );
    }

    const moduleSpec = MODULES[moduleId];
    const minX = room.origin.x;
    const minY = room.origin.y;
    const maxX = room.origin.x + room.width - moduleSpec.width;
    const maxY = room.origin.y + room.depth - moduleSpec.depth;

    const clampedX = Math.min(Math.max(raw.x, minX), maxX);
    const clampedY = Math.min(Math.max(raw.y, minY), maxY);

    results.push({
      roomId: room.id,
      moduleId,
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      rotation:
        raw.rotation !== undefined
          ? Math.round(raw.rotation / 90) * 90
          : undefined,
      option: raw.option ?? undefined,
      note: raw.note ?? undefined,
    });
  }

  return results;
}

function validateModuleCounts(
  expected: Map<ModuleId, number>,
  received: NormalizedPlacement[],
) {
  const counts = new Map<ModuleId, number>();
  for (const placement of received) {
    counts.set(placement.moduleId, (counts.get(placement.moduleId) ?? 0) + 1);
  }

  for (const [moduleId, expectedCount] of expected.entries()) {
    const actual = counts.get(moduleId) ?? 0;
    if (actual !== expectedCount) {
      throw new Error(
        `LLM output mismatched module count for ${moduleId}: expected ${expectedCount}, received ${actual}`,
      );
    }
  }
}

function buildDeterministicPlacements(
  layout: typeof LAYOUTS[LayoutId],
): NormalizedPlacement[] {
  return layout.rooms.flatMap((room) =>
    room.placements.map((placement) => ({
      roomId: room.id,
      moduleId: placement.moduleId as ModuleId,
      x: Math.round(placement.x),
      y: Math.round(placement.y),
      rotation:
        placement.rotation !== undefined
          ? Math.round(placement.rotation)
          : undefined,
      note: placement.note ?? undefined,
    })),
  );
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header." },
        { status: 401 },
      );
    }

    const idToken = authHeader.substring("Bearer ".length).trim();
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const ownerUid = decoded.uid;

    const rawBody = await request.json();
    const payload = requestSchema.parse(rawBody);
    const { designId, layouts, finishes } = payload;

    const firestore = getAdminFirestore();
    const designRef = firestore.collection("designs").doc(designId);

    await firestore.runTransaction(async (tx) => {
      const snapshot = await tx.get(designRef);
      if (snapshot.exists) {
        tx.update(designRef, {
          selectedLayouts: layouts,
          finishes,
          ownerUid,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(designRef, {
          ownerUid,
          selectedLayouts: layouts,
          finishes,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());

    if (!hasGeminiKey) {
      const layoutResults: GeneratedVariant[] = [];

      for (const layoutId of layouts) {
        const layout = LAYOUTS[layoutId];
        if (!layout) {
          throw new Error(`Layout configuration missing for ${layoutId}.`);
        }

        const deterministicPlacements = buildDeterministicPlacements(layout);
        const pricing = calculatePricing(
          deterministicPlacements.map((placement) => ({
            moduleId: placement.moduleId,
          })),
          finishes,
        );

        for (
          let variantIndex = 0;
          variantIndex < VARIANTS_PER_LAYOUT;
          variantIndex += 1
        ) {
          const variantRef = designRef
            .collection("variants")
            .doc(`${layoutId}-fallback-v${variantIndex + 1}-${crypto.randomUUID()}`);

          const rationale = `Deterministic fallback variant ${variantIndex + 1} without Gemini key.`;

          await variantRef.set({
            designId,
            layoutId,
            layoutName: layout.name,
            variantIndex: variantIndex + 1,
            ownerUid,
            finishes,
            placements: deterministicPlacements,
            rationale,
            pricing,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            model: "deterministic-fallback",
            llmStrategy: "deterministic-fallback",
          });

          layoutResults.push({
            layoutId,
            variantIndex: variantIndex + 1,
            variantId: variantRef.id,
            placements: deterministicPlacements.map((placement) => ({ ...placement })),
            rationale,
            pricing,
            llmStrategy: "deterministic-fallback",
          });
        }
      }

      await designRef.set(
        {
          lastGeneratedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return NextResponse.json(
        {
          designId,
          variants: layoutResults,
        },
        { status: 200 },
      );
    }

    const semaphore = new Semaphore(8);

    const layoutResults: GeneratedVariant[] = [];

    for (const layoutId of layouts) {
      const layout = LAYOUTS[layoutId];
      if (!layout) {
        throw new Error(`Layout configuration missing for ${layoutId}.`);
      }
      const expectedCounts = createModuleCountMap(layout);

      const variants = await Promise.all(
        Array.from({ length: VARIANTS_PER_LAYOUT }, (_unused, variantIndex) =>
          runWithSemaphore(semaphore, async () => {
            const llmResult = await callGeminiWithSchema({
              systemPrompt: SYSTEM_PROMPT,
              userPrompt: buildUserPrompt(layout, variantIndex, finishes),
              finishes,
            });

            const parsed = llmResponseSchema.parse(
              JSON.parse(llmResult.jsonText),
            );
            const normalizedPlacements = normalisePlacements(
              layout,
              parsed.placements,
            );

            validateModuleCounts(expectedCounts, normalizedPlacements);

            const pricing = calculatePricing(
              normalizedPlacements.map((placement) => ({
                moduleId: placement.moduleId,
              })),
              finishes,
            );

            const variantRef = designRef
              .collection("variants")
              .doc(`${layoutId}-v${variantIndex + 1}-${crypto.randomUUID()}`);

            await variantRef.set({
              designId,
              layoutId,
              layoutName: layout.name,
              variantIndex: variantIndex + 1,
              ownerUid,
              finishes,
              placements: normalizedPlacements,
              rationale: parsed.rationale,
              pricing,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              model: llmResult.model,
              llmStrategy: llmResult.strategy,
            });

            return {
              layoutId,
              variantIndex: variantIndex + 1,
              variantId: variantRef.id,
              placements: normalizedPlacements,
              rationale: parsed.rationale,
              pricing,
              llmStrategy: llmResult.strategy,
            } satisfies GeneratedVariant;
          }),
        ),
      );

      layoutResults.push(...variants);
    }

    await designRef.set(
      {
        lastGeneratedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json(
      {
        designId,
        variants: layoutResults,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: error.flatten() },
        { status: 422 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    console.error("[llm/fuse] error", message);
    return NextResponse.json(
      { error: "Failed to generate layout variants.", detail: message },
      { status: 500 },
    );
  }
}

