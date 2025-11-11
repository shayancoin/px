import {
  MATERIAL_MANIFEST,
  MODULES,
  toDesignFinishes,
  type FinishSelection,
  type ModuleId,
  type ModulePlacement,
} from "@/domain/spec";
import {
  priceUSD,
  type Design,
  type DesignPlacement,
  type LayoutId as CanonicalLayoutId,
} from "@repo/design-engine";

export const DEPOSIT_RATE = 0.2;

export interface PricingBreakdown {
  moduleSubtotalUSD: number;
  doorMultiplier: number;
  topMultiplier: number;
  finishesMultiplier: number;
  totalUSD: number;
  depositUSD: number;
}

function getModuleCost(moduleId: ModuleId): number {
  const moduleSpec = MODULES[moduleId];
  if (!moduleSpec) {
    throw new Error(`Unknown module provided for pricing: ${moduleId}`);
  }
  return moduleSpec.baseCostUSD;
}

function sumModuleCosts(
  placements: Array<Pick<ModulePlacement, "moduleId">>,
): number {
  return placements.reduce((acc, placement) => {
    return acc + getModuleCost(placement.moduleId);
  }, 0);
}

function resolveDoorMultiplier(selection: FinishSelection): number {
  const definition = MATERIAL_MANIFEST.doors[selection.door];
  if (!definition) {
    throw new Error(`Invalid door finish selection: ${selection.door}`);
  }
  return definition.multiplier;
}

function resolveTopMultiplier(selection: FinishSelection): number {
  const definition = MATERIAL_MANIFEST.tops[selection.top];
  if (!definition) {
    throw new Error(`Invalid countertop finish selection: ${selection.top}`);
  }
  return definition.multiplier;
}

const PRICING_LAYOUT: CanonicalLayoutId = "BACK_KITCHEN";

function buildPricingDesign(
  placements: Array<Pick<ModulePlacement, "moduleId">>,
  finishes: FinishSelection,
): Design {
  const designFinishes = toDesignFinishes(finishes);
  const designPlacements: DesignPlacement[] = placements.map((placement, index) => {
    const spec = MODULES[placement.moduleId];
    if (!spec) {
      throw new Error(`Unknown module provided for pricing: ${placement.moduleId}`);
    }
    const key = `pricing:${placement.moduleId}:${index}`;
    return {
      id: key,
      key,
      roomId: "pricing",
      moduleId: placement.moduleId,
      x: 0,
      y: 0,
      optional: false,
      source: "base",
      width: spec.width,
      depth: spec.depth,
      height: spec.height,
      category: spec.category,
    };
  });

  return {
    layout: PRICING_LAYOUT,
    name: "Pricing Synthetic Layout",
    summary: "Deterministic synthetic layout for pricing breakdowns",
    door: designFinishes.door,
    top: designFinishes.top,
    rooms: [
      {
        id: "pricing",
        label: "Pricing",
        width: 0,
        depth: 0,
        origin: { x: 0, y: 0 },
        placements: designPlacements,
      },
    ],
    operations: [],
    metadata: {
      basePriceUSD: 0,
      currentPriceUSD: 0,
    },
    createdAt: new Date(0).toISOString(),
  };
}

export function calculatePricing(
  placements: Array<Pick<ModulePlacement, "moduleId">>,
  finishes: FinishSelection,
  depositRate: number = DEPOSIT_RATE,
): PricingBreakdown {
  if (placements.length === 0) {
    return {
      moduleSubtotalUSD: 0,
      doorMultiplier: resolveDoorMultiplier(finishes),
      topMultiplier: resolveTopMultiplier(finishes),
      finishesMultiplier: 0,
      totalUSD: 0,
      depositUSD: 0,
    };
  }

  const moduleSubtotalUSD = sumModuleCosts(placements);
  const doorMultiplier = resolveDoorMultiplier(finishes);
  const topMultiplier = resolveTopMultiplier(finishes);
  const finishesMultiplier = doorMultiplier * topMultiplier;

  const design = buildPricingDesign(placements, finishes);
  const totalUSD = priceUSD(design);
  design.metadata.basePriceUSD = totalUSD;
  design.metadata.currentPriceUSD = totalUSD;
  const depositUSD = Math.round(totalUSD * depositRate);

  return {
    moduleSubtotalUSD,
    doorMultiplier,
    topMultiplier,
    finishesMultiplier,
    totalUSD,
    depositUSD,
  };
}

export function formatUSD(value: number, minimumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits,
    maximumFractionDigits: Math.max(2, minimumFractionDigits),
  }).format(value);
}



