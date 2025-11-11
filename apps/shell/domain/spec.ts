import materialsManifest from "../public/materials/manifest.json";

import {
  DEFAULT_FINISH_SELECTION,
  DOOR_OPTIONS,
  DOOR_TOKENS,
  LEGACY_LAYOUT_OPTIONS,
  LAYOUT_OPTIONS,
  MODULE_IDS,
  MODULE_LIST,
  MODULES,
  MILLIMETER_TO_PIXEL,
  PIXEL_TO_MILLIMETER,
  TOP_OPTIONS,
  TOP_TOKENS,
  canonicalLayoutId,
  doorManifestIdToToken as engineDoorManifestIdToToken,
  doorTokenToManifestId as engineDoorTokenToManifestId,
  getLayoutById as getCanonicalLayoutById,
  legacyLayoutId,
  topManifestIdToToken as engineTopManifestIdToToken,
  topTokenToManifestId as engineTopTokenToManifestId,
  type DoorColor,
  type LayoutId as CanonicalLayoutId,
  type LayoutRoom as CanonicalLayoutRoom,
  type LayoutSpec as CanonicalLayoutSpec,
  type LegacyLayoutId,
  type ModuleCategory,
  type ModuleId,
  type ModulePlacement,
  type ModuleSpec,
  type TopColor,
} from "@repo/design-engine";

export {
  DEFAULT_FINISH_SELECTION,
  DOOR_OPTIONS,
  DOOR_TOKENS,
  MILLIMETER_TO_PIXEL,
  PIXEL_TO_MILLIMETER,
  MODULE_IDS,
  MODULE_LIST,
  MODULES,
  TOP_OPTIONS,
  TOP_TOKENS,
  canonicalLayoutId,
  legacyLayoutId,
};

export { getLayoutById as getCanonicalLayoutById } from "@repo/design-engine";

export type {
  DoorColor,
  ModuleCategory,
  ModuleId,
  ModulePlacement,
  ModuleSpec,
  TopColor,
};

export const MIN_LAYOUT_SELECTION = 1;
export const MAX_LAYOUT_SELECTION = 4;
export const VARIANTS_PER_LAYOUT = 4;

export type LayoutId = LegacyLayoutId;
export type LayoutRoom = CanonicalLayoutRoom;
export type LayoutSpec = Omit<CanonicalLayoutSpec, "id"> & { id: LayoutId };

const cloneLayout = (spec: CanonicalLayoutSpec, legacyId: LayoutId): LayoutSpec => ({
  ...spec,
  id: legacyId,
  rooms: spec.rooms.map((room) => ({
    ...room,
    origin: { ...room.origin },
    placements: room.placements.map((placement) => ({ ...placement })),
  })),
});

const ENGINE_LAYOUTS = new Map(
  LAYOUT_OPTIONS.map((canonicalId) => {
    const legacyId = legacyLayoutId(canonicalId);
    const spec = getCanonicalLayoutById(canonicalId);
    return [legacyId, cloneLayout(spec, legacyId)] as const;
  }),
);

export const LAYOUTS = Object.fromEntries(ENGINE_LAYOUTS.entries()) as Record<
  LayoutId,
  LayoutSpec
>;

export const LAYOUT_IDS = Array.from(LEGACY_LAYOUT_OPTIONS) as LayoutId[];
export const LAYOUT_LIST = LAYOUT_IDS.map((legacyId) => getLayoutById(legacyId));

export function getLayoutById(id: LayoutId | CanonicalLayoutId): LayoutSpec {
  const canonical = canonicalLayoutId(id);
  const legacy = legacyLayoutId(canonical);
  return cloneLayout(getCanonicalLayoutById(canonical), legacy);
}

export function toCanonicalLayoutId(
  id: LayoutId | CanonicalLayoutId,
): CanonicalLayoutId {
  return canonicalLayoutId(id);
}

export type MaterialDefinition = {
  token: string;
  hex: string;
  img: string;
  jpg: string;
  multiplier: number;
  repeatUV?: [number, number];
};

export type MaterialManifest = {
  doors: Record<string, MaterialDefinition>;
  tops: Record<string, MaterialDefinition>;
};

export const MATERIAL_MANIFEST = materialsManifest as MaterialManifest;

export type DoorManifestId = keyof MaterialManifest["doors"];
export type TopManifestId = keyof MaterialManifest["tops"];

export interface FinishSelection {
  door: DoorManifestId;
  top: TopManifestId;
}

export const DOOR_FINISH_IDS = Object.keys(
  MATERIAL_MANIFEST.doors,
) as DoorManifestId[];
export const TOP_FINISH_IDS = Object.keys(
  MATERIAL_MANIFEST.tops,
) as TopManifestId[];

export function resolveDoorMaterial(manifestId: DoorManifestId): MaterialDefinition {
  const material = MATERIAL_MANIFEST.doors[manifestId];
  if (!material) {
    throw new Error(`Unknown door material: ${manifestId}`);
  }
  return material;
}

export function resolveTopMaterial(manifestId: TopManifestId): MaterialDefinition {
  const material = MATERIAL_MANIFEST.tops[manifestId];
  if (!material) {
    throw new Error(`Unknown countertop material: ${manifestId}`);
  }
  return material;
}

export function doorManifestIdToToken(manifestId: DoorManifestId): DoorColor {
  return engineDoorManifestIdToToken(manifestId);
}

export function doorTokenToManifestId(token: DoorColor): DoorManifestId {
  const manifestId = engineDoorTokenToManifestId(token);
  if (!MATERIAL_MANIFEST.doors[manifestId]) {
    throw new Error(`Unknown door token: ${token}`);
  }
  return manifestId as DoorManifestId;
}

export function topManifestIdToToken(manifestId: TopManifestId): TopColor {
  return engineTopManifestIdToToken(manifestId);
}

export function topTokenToManifestId(token: TopColor): TopManifestId {
  const manifestId = engineTopTokenToManifestId(token);
  if (!MATERIAL_MANIFEST.tops[manifestId]) {
    throw new Error(`Unknown top token: ${token}`);
  }
  return manifestId as TopManifestId;
}

export function doorTokenToManifestEntry(token: DoorColor): MaterialDefinition {
  return resolveDoorMaterial(doorTokenToManifestId(token));
}

export function topTokenToManifestEntry(token: TopColor): MaterialDefinition {
  return resolveTopMaterial(topTokenToManifestId(token));
}

export function toDesignFinishes(selection: FinishSelection): {
  door: DoorColor;
  top: TopColor;
} {
  return {
    door: doorManifestIdToToken(selection.door),
    top: topManifestIdToToken(selection.top),
  };
}

export function fromDesignFinishes(door: DoorColor, top: TopColor): FinishSelection {
  return {
    door: doorTokenToManifestId(door),
    top: topTokenToManifestId(top),
  };
}
