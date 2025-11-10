import materialsManifest from "../public/materials/manifest.json";

export const MILLIMETER_TO_PIXEL = 0.2;
export const PIXEL_TO_MILLIMETER = 1 / MILLIMETER_TO_PIXEL;

export const MIN_LAYOUT_SELECTION = 1;
export const MAX_LAYOUT_SELECTION = 4;
export const VARIANTS_PER_LAYOUT = 4;

export type ModuleCategory =
  | "Column"
  | "Base"
  | "Snack"
  | "Upper";

export type ModuleId =
  | "CAFI"
  | "CAMI"
  | "CAOV"
  | "CAFE"
  | "CSSP"
  | "CSDP"
  | "BARA"
  | "BSDR"
  | "BSDD"
  | "BSSD"
  | "ISNA"
  | "BADI"
  | "USDO";

export interface ModuleSpec {
  id: ModuleId;
  category: ModuleCategory;
  label: string;
  width: number;
  depth: number;
  height: number;
  baseCostUSD: number;
}

export const MODULES: Record<ModuleId, ModuleSpec> = {
  CAFI: {
    id: "CAFI",
    category: "Column",
    label: "Fridge Unit",
    width: 600,
    depth: 595,
    height: 2123,
    baseCostUSD: 1200,
  },
  CAMI: {
    id: "CAMI",
    category: "Column",
    label: "Microwave Unit",
    width: 600,
    depth: 595,
    height: 2123,
    baseCostUSD: 1200,
  },
  CAOV: {
    id: "CAOV",
    category: "Column",
    label: "Oven Unit",
    width: 600,
    depth: 595,
    height: 2123,
    baseCostUSD: 1200,
  },
  CAFE: {
    id: "CAFE",
    category: "Column",
    label: "Freezer Unit",
    width: 600,
    depth: 595,
    height: 2123,
    baseCostUSD: 1200,
  },
  CSSP: {
    id: "CSSP",
    category: "Column",
    label: "Pantry",
    width: 600,
    depth: 595,
    height: 2123,
    baseCostUSD: 1200,
  },
  CSDP: {
    id: "CSDP",
    category: "Column",
    label: "Double Pantry",
    width: 1256,
    depth: 595,
    height: 2123,
    baseCostUSD: 1800,
  },
  BARA: {
    id: "BARA",
    category: "Base",
    label: "Range Unit",
    width: 1200,
    depth: 745,
    height: 828,
    baseCostUSD: 800,
  },
  BSDR: {
    id: "BSDR",
    category: "Base",
    label: "Drawer Base",
    width: 1200,
    depth: 745,
    height: 828,
    baseCostUSD: 600,
  },
  BSDD: {
    id: "BSDD",
    category: "Base",
    label: "Double Door Base",
    width: 1200,
    depth: 595,
    height: 633,
    baseCostUSD: 500,
  },
  BSSD: {
    id: "BSSD",
    category: "Base",
    label: "Single Door Base",
    width: 600,
    depth: 595,
    height: 633,
    baseCostUSD: 400,
  },
  ISNA: {
    id: "ISNA",
    category: "Snack",
    label: "Island Extension",
    width: 1200,
    depth: 1240,
    height: 932,
    baseCostUSD: 2000,
  },
  BADI: {
    id: "BADI",
    category: "Upper",
    label: "Upper Door",
    width: 600,
    depth: 595,
    height: 722,
    baseCostUSD: 400,
  },
  USDO: {
    id: "USDO",
    category: "Base",
    label: "Dishwasher Unit",
    width: 600,
    depth: 595,
    height: 828,
    baseCostUSD: 400,
  },
};

export const MODULE_LIST = Object.values(MODULES);
export const MODULE_IDS = Object.keys(MODULES) as ModuleId[];

export type LayoutId =
  | "TWO_X_KITCHEN"
  | "DUAL_ISLAND"
  | "WOKE_KITCHEN"
  | "LINEAR";

export interface ModulePlacement {
  moduleId: ModuleId;
  x: number;
  y: number;
  rotation?: number;
  note?: string;
}

export interface LayoutRoom {
  id: string;
  label: string;
  width: number;
  depth: number;
  origin: {
    x: number;
    y: number;
  };
  placements: ModulePlacement[];
}

export interface LayoutSpec {
  id: LayoutId;
  name: string;
  summary: string;
  rooms: LayoutRoom[];
  defaultScale: number;
}

const twoXKitchen: LayoutSpec = {
  id: "TWO_X_KITCHEN",
  name: "2X Kitchen (Show + Prep)",
  summary:
    "Dual-room layout with a showcase kitchen and offset prep space for parallel workflows.",
  defaultScale: MILLIMETER_TO_PIXEL,
  rooms: [
    {
      id: "show",
      label: "Show Kitchen",
      width: 6000,
      depth: 3500,
      origin: { x: 0, y: 0 },
      placements: [
        { moduleId: "CAFI", x: 200, y: 0 },
        { moduleId: "CAOV", x: 800, y: 0 },
        { moduleId: "CAMI", x: 1400, y: 0 },
        { moduleId: "BARA", x: 2000, y: 0 },
        { moduleId: "BSDD", x: 3200, y: 0 },
        { moduleId: "CSSP", x: 4400, y: 0 },
        { moduleId: "BSSD", x: 5000, y: 0 },
        { moduleId: "ISNA", x: 1800, y: 1900, note: "Show island left" },
        { moduleId: "ISNA", x: 3200, y: 1900, note: "Show island right" },
      ],
    },
    {
      id: "prep",
      label: "Prep Kitchen",
      width: 4500,
      depth: 3000,
      origin: { x: 7000, y: 0 },
      placements: [
        { moduleId: "CSSP", x: 7100, y: 0 },
        { moduleId: "USDO", x: 7700, y: 0 },
        { moduleId: "BSDD", x: 8300, y: 0 },
        { moduleId: "BSDR", x: 9500, y: 0 },
        { moduleId: "CAFE", x: 10900, y: 0 },
      ],
    },
  ],
};

const dualIsland: LayoutSpec = {
  id: "DUAL_ISLAND",
  name: "Dual Island",
  summary: "Symmetric dual-island layout for entertaining and prep zones.",
  defaultScale: MILLIMETER_TO_PIXEL,
  rooms: [
    {
      id: "primary",
      label: "Dual Island Room",
      width: 6000,
      depth: 4000,
      origin: { x: 0, y: 0 },
      placements: [
        { moduleId: "CAFI", x: 200, y: 0 },
        { moduleId: "USDO", x: 800, y: 0 },
        { moduleId: "BARA", x: 1400, y: 0 },
        { moduleId: "BSDD", x: 2600, y: 0 },
        { moduleId: "CSSP", x: 3800, y: 0 },
        { moduleId: "CAOV", x: 4400, y: 0 },
        { moduleId: "CAMI", x: 5000, y: 0 },
        { moduleId: "ISNA", x: 1500, y: 2000, note: "Wet island" },
        { moduleId: "ISNA", x: 3000, y: 2600, note: "Dry island" },
      ],
    },
  ],
};

const wokeKitchen: LayoutSpec = {
  id: "WOKE_KITCHEN",
  name: "Woke Kitchen",
  summary:
    "Partition-ready layout balancing pantry storage and preparation zones.",
  defaultScale: MILLIMETER_TO_PIXEL,
  rooms: [
    {
      id: "primary",
      label: "Woke Kitchen",
      width: 6500,
      depth: 4200,
      origin: { x: 0, y: 0 },
      placements: [
        { moduleId: "CAFI", x: 200, y: 0 },
        { moduleId: "USDO", x: 800, y: 0 },
        { moduleId: "BARA", x: 1400, y: 0 },
        { moduleId: "BSDD", x: 2600, y: 0 },
        { moduleId: "CSDP", x: 3800, y: 0, note: "Ends at 5056" },
        { moduleId: "CAMI", x: 5056, y: 0 },
        { moduleId: "CAOV", x: 5656, y: 0 },
        { moduleId: "ISNA", x: 2600, y: 2400 },
      ],
    },
  ],
};

const linearKitchen: LayoutSpec = {
  id: "LINEAR",
  name: "Disappearing Linear",
  summary:
    "Concealed functional wall with a monolithic island for minimal visual clutter.",
  defaultScale: MILLIMETER_TO_PIXEL,
  rooms: [
    {
      id: "primary",
      label: "Linear Kitchen",
      width: 5200,
      depth: 3600,
      origin: { x: 0, y: 0 },
      placements: [
        { moduleId: "CSDP", x: 200, y: 0, note: "Ends at 1456" },
        { moduleId: "CAFI", x: 1456, y: 0 },
        { moduleId: "CAMI", x: 2056, y: 0 },
        { moduleId: "CAOV", x: 2656, y: 0 },
        { moduleId: "BARA", x: 3256, y: 0 },
        { moduleId: "CSSP", x: 4456, y: 0 },
        { moduleId: "ISNA", x: 1400, y: 2200 },
        { moduleId: "ISNA", x: 2800, y: 2200 },
      ],
    },
  ],
};

export const LAYOUTS: Record<LayoutId, LayoutSpec> = {
  TWO_X_KITCHEN: twoXKitchen,
  DUAL_ISLAND: dualIsland,
  WOKE_KITCHEN: wokeKitchen,
  LINEAR: linearKitchen,
};

export const LAYOUT_LIST = Object.values(LAYOUTS);
export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];

export type MaterialKey = keyof typeof materialsManifest;

export interface MaterialDefinition {
  token: string;
  hex: string;
  img: string;
  jpg: string;
  multiplier: number;
  repeatUV?: [number, number];
}

export interface MaterialManifest {
  doors: Record<string, MaterialDefinition>;
  tops: Record<string, MaterialDefinition>;
}

export const MATERIAL_MANIFEST = materialsManifest as MaterialManifest;

export const DOOR_FINISH_IDS = Object.keys(
  MATERIAL_MANIFEST.doors,
) as string[];
export const TOP_FINISH_IDS = Object.keys(MATERIAL_MANIFEST.tops) as string[];

export type DoorFinishId = (typeof DOOR_FINISH_IDS)[number];
export type TopFinishId = (typeof TOP_FINISH_IDS)[number];

export interface FinishSelection {
  door: DoorFinishId;
  top: TopFinishId;
}

export function getModuleById(moduleId: ModuleId): ModuleSpec {
  const moduleSpec = MODULES[moduleId];
  if (!moduleSpec) {
    throw new Error(`Unknown module id: ${moduleId}`);
  }
  return moduleSpec;
}

export function getLayoutById(layoutId: LayoutId): LayoutSpec {
  const layout = LAYOUTS[layoutId];
  if (!layout) {
    throw new Error(`Unknown layout id: ${layoutId}`);
  }
  return layout;
}

