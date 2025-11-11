import materialsManifest from "../public/materials/manifest.json";

import {
  MILLIMETER_TO_PIXEL,
  PIXEL_TO_MILLIMETER,
  MIN_LAYOUT_SELECTION,
  MAX_LAYOUT_SELECTION,
  VARIANTS_PER_LAYOUT,
  MODULES,
  MODULE_IDS,
  MODULE_LIST,
  type ModuleId,
  type ModuleSpec,
  type ModuleCategory,
  type ModulePlacement,
  type LayoutSpec as EngineLayoutSpec,
  type LayoutRoom as EngineLayoutRoom,
  type LayoutId as CanonicalLayoutId,
  type LegacyLayoutId,
  LAYOUT_OPTIONS as CANONICAL_LAYOUT_OPTIONS,
  canonicalLayoutId,
  legacyLayoutId,
  getLayoutById as getCanonicalLayoutById,
  DOOR_OPTIONS,
  TOP_OPTIONS,
  type DoorColor,
  type TopColor,
} from "@repo/design-engine";

export {
  MILLIMETER_TO_PIXEL,
  PIXEL_TO_MILLIMETER,
  MIN_LAYOUT_SELECTION,
  MAX_LAYOUT_SELECTION,
  VARIANTS_PER_LAYOUT,
  MODULES,
  MODULE_IDS,
  MODULE_LIST,
};

export type { ModuleId, ModuleSpec, ModuleCategory, ModulePlacement };

export type LayoutId = LegacyLayoutId;
export type LayoutRoom = EngineLayoutRoom;
export type LayoutSpec = Omit<EngineLayoutSpec, "id"> & { id: LayoutId };

const ENGINE_LAYOUTS = new Map(
  CANONICAL_LAYOUT_OPTIONS.map((canonicalId) => {
    const spec = getCanonicalLayoutById(canonicalId);
    const legacyId = legacyLayoutId(canonicalId);
    return [
      legacyId,
      {
        ...spec,
        id: legacyId,
        rooms: spec.rooms.map((room) => ({
          ...room,
          placements: room.placements.map((placement) => ({ ...placement })),
        })),
      } satisfies LayoutSpec,
    ] as const;
  }),
);

export const LAYOUTS = Object.fromEntries(ENGINE_LAYOUTS.entries()) as Record<
  LayoutId,
  LayoutSpec
>;

export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];
export const LAYOUT_LIST = LAYOUT_IDS.map((layoutId) => LAYOUTS[layoutId]);

export function getLayoutById(id: LayoutId | CanonicalLayoutId): LayoutSpec {
  const canonical = canonicalLayoutId(id);
  const legacy = legacyLayoutId(canonical);
  const spec = LAYOUTS[legacy];
  if (!spec) {
    throw new Error(`Unknown layout id: ${id}`);
  }
  return spec;
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

const DOOR_TOKEN_BY_MANIFEST = Object.fromEntries(
  DOOR_OPTIONS.map((option) => [option.manifestId, option.token]),
) as Record<string, DoorColor>;

const DOOR_MANIFEST_BY_TOKEN = Object.fromEntries(
  DOOR_OPTIONS.map((option) => [option.token, option.manifestId]),
) as Record<DoorColor, string>;

const TOP_TOKEN_BY_MANIFEST = Object.fromEntries(
  TOP_OPTIONS.map((option) => [option.manifestId, option.token]),
) as Record<string, TopColor>;

const TOP_MANIFEST_BY_TOKEN = Object.fromEntries(
  TOP_OPTIONS.map((option) => [option.token, option.manifestId]),
) as Record<TopColor, string>;

export function doorManifestIdToToken(manifestId: DoorManifestId): DoorColor {
  const token = DOOR_TOKEN_BY_MANIFEST[manifestId];
  if (!token) {
    throw new Error(`Unknown door manifest id: ${manifestId}`);
  }
  return token;
}

export function doorTokenToManifestId(token: DoorColor): DoorManifestId {
  const manifestId = DOOR_MANIFEST_BY_TOKEN[token];
  if (!manifestId) {
    throw new Error(`Unknown door token: ${token}`);
  }
  return manifestId as DoorManifestId;
}

export function topManifestIdToToken(manifestId: TopManifestId): TopColor {
  const token = TOP_TOKEN_BY_MANIFEST[manifestId];
  if (!token) {
    throw new Error(`Unknown top manifest id: ${manifestId}`);
  }
  return token;
}

export function topTokenToManifestId(token: TopColor): TopManifestId {
  const manifestId = TOP_MANIFEST_BY_TOKEN[token];
  if (!manifestId) {
    throw new Error(`Unknown top token: ${token}`);
  }
  return manifestId as TopManifestId;
}

export function resolveDoorMaterial(
  manifestId: DoorManifestId,
): MaterialDefinition {
  const material = MATERIAL_MANIFEST.doors[manifestId];
  if (!material) {
    throw new Error(`Unknown door material: ${manifestId}`);
  }
  return material;
}

export function resolveTopMaterial(
  manifestId: TopManifestId,
): MaterialDefinition {
  const material = MATERIAL_MANIFEST.tops[manifestId];
  if (!material) {
    throw new Error(`Unknown countertop material: ${manifestId}`);
  }
  return material;
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

export const DOOR_TOKENS = DOOR_OPTIONS.map((option) => option.token) as DoorColor[];
export const TOP_TOKENS = TOP_OPTIONS.map((option) => option.token) as TopColor[];

import materialsManifest from "../public/materials/manifest.json";

export const MIN_LAYOUT_SELECTION = 1;
export const MAX_LAYOUT_SELECTION = 4;
export const VARIANTS_PER_LAYOUT = 4;

export * from "@repo/design-engine";
export type { DesignRoom as LayoutRoom, DesignPlacement as ModulePlacement } from "@repo/design-engine";

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

const DOOR_TOKEN_TO_MANIFEST: Record<import("@repo/design-engine").DoorColor, string> = {} as Record<
  import("@repo/design-engine").DoorColor,
  string
>;
const TOP_TOKEN_TO_MANIFEST: Record<import("@repo/design-engine").TopColor, string> = {} as Record<
  import("@repo/design-engine").TopColor,
  string
>;

for (const [manifestId, definition] of Object.entries(MATERIAL_MANIFEST.doors)) {
  const token = definition.token.replace(/^\$/, "");
  DOOR_TOKEN_TO_MANIFEST[token as import("@repo/design-engine").DoorColor] = manifestId;
}

for (const [manifestId, definition] of Object.entries(MATERIAL_MANIFEST.tops)) {
  const token = definition.token.replace(/^\$/, "");
  TOP_TOKEN_TO_MANIFEST[token as import("@repo/design-engine").TopColor] = manifestId;
}

export const DOOR_MANIFEST_IDS = Object.keys(MATERIAL_MANIFEST.doors) as string[];
export const TOP_MANIFEST_IDS = Object.keys(MATERIAL_MANIFEST.tops) as string[];

export function doorTokenToManifestEntry(token: import("@repo/design-engine").DoorColor): MaterialDefinition {
  const manifestId = DOOR_TOKEN_TO_MANIFEST[token];
  if (!manifestId) {
    throw new Error(`Unknown door token: ${token}`);
  }
  return MATERIAL_MANIFEST.doors[manifestId];
}

export function topTokenToManifestEntry(token: import("@repo/design-engine").TopColor): MaterialDefinition {
  const manifestId = TOP_TOKEN_TO_MANIFEST[token];
  if (!manifestId) {
    throw new Error(`Unknown top token: ${token}`);
  }
  return MATERIAL_MANIFEST.tops[manifestId];
}

export function manifestDoorIdToToken(manifestId: string): import("@repo/design-engine").DoorColor {
  const entry = Object.entries(DOOR_TOKEN_TO_MANIFEST).find(([, value]) => value === manifestId);
  if (!entry) {
    throw new Error(`Unknown door manifest identifier: ${manifestId}`);
  }
  return entry[0] as import("@repo/design-engine").DoorColor;
}

export function manifestTopIdToToken(manifestId: string): import("@repo/design-engine").TopColor {
  const entry = Object.entries(TOP_TOKEN_TO_MANIFEST).find(([, value]) => value === manifestId);
  if (!entry) {
    throw new Error(`Unknown top manifest identifier: ${manifestId}`);
  }
  return entry[0] as import("@repo/design-engine").TopColor;
}
