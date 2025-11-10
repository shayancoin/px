import {
  MATERIAL_MANIFEST,
  MODULES,
  type FinishSelection,
  type ModulePlacement,
  type ModuleId,
} from "@/domain/spec";

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

  const totalUSD = Math.round(moduleSubtotalUSD * finishesMultiplier);
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



