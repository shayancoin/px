export const MILLIMETER_TO_PIXEL = 0.2;
export const PIXEL_TO_MILLIMETER = 1 / MILLIMETER_TO_PIXEL;

export type ModuleCategory = "Column" | "Base" | "Snack" | "Upper";

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
  | "BACK_KITCHEN"
  | "DUAL_ISLAND"
  | "BROKEN_PLAN"
  | "DISAPPEARING_LINEAR";

type LegacyLayoutId = "TWO_X_KITCHEN" | "WOKE_KITCHEN" | "LINEAR";

const LAYOUT_ALIASES: Record<LayoutId | LegacyLayoutId, LayoutId> = {
  BACK_KITCHEN: "BACK_KITCHEN",
  DUAL_ISLAND: "DUAL_ISLAND",
  BROKEN_PLAN: "BROKEN_PLAN",
  DISAPPEARING_LINEAR: "DISAPPEARING_LINEAR",
  TWO_X_KITCHEN: "BACK_KITCHEN",
  WOKE_KITCHEN: "BROKEN_PLAN",
  LINEAR: "DISAPPEARING_LINEAR",
};

export function normalizeLayoutId(value: string): LayoutId {
  const key = value.toUpperCase().replace(/[^A-Z_]/g, "_") as LayoutId | LegacyLayoutId;
  const resolved = LAYOUT_ALIASES[key];
  if (!resolved) {
    throw new Error(`Unsupported layout id: ${value}`);
  }
  return resolved;
}

export type DoorColor = "DFIB" | "DFKW" | "DFLG" | "DFHS";
export type TopColor = "CDSM" | "CDZM" | "CMSW" | "CMCA";

export interface MaterialOptionBase {
  token: string;
  label: string;
  manifestId: string;
  hex: string;
  img: string;
  jpg: string;
  multiplier: number;
}

export interface DoorMaterialOption extends MaterialOptionBase {}

export interface TopMaterialOption extends MaterialOptionBase {
  repeatUV?: [number, number];
}

const DOOR_MATERIALS: Record<DoorColor, DoorMaterialOption> = {
  DFIB: {
    token: "DFIB",
    label: "Fenix Ingo Black",
    manifestId: "Fenix-Ingo-Black",
    hex: "#111214",
    img: "/materials/doors/Fenix-Ingo-Black.webp",
    jpg: "/materials/doors/Fenix-Ingo-Black.jpg",
    multiplier: 1.0,
  },
  DFKW: {
    token: "DFKW",
    label: "Fenix Kos White",
    manifestId: "Fenix-Kos-White",
    hex: "#F5F4F2",
    img: "/materials/doors/Fenix-Kos-White.webp",
    jpg: "/materials/doors/Fenix-Kos-White.jpg",
    multiplier: 1.0,
  },
  DFLG: {
    token: "DFLG",
    label: "Fenix London Grey",
    manifestId: "Fenix-London-Grey",
    hex: "#7D868E",
    img: "/materials/doors/Fenix-London-Grey.webp",
    jpg: "/materials/doors/Fenix-London-Grey.jpg",
    multiplier: 1.0,
  },
  DFHS: {
    token: "DFHS",
    label: "Fenix Hamilton Steel",
    manifestId: "Fenix-Hamilton-Steel",
    hex: "#8D8F91",
    img: "/materials/doors/Fenix-Hamilton-Steel.webp",
    jpg: "/materials/doors/Fenix-Hamilton-Steel.jpg",
    multiplier: 1.2,
  },
};

const TOP_MATERIALS: Record<TopColor, TopMaterialOption> = {
  CDSM: {
    token: "CDSM",
    label: "Dekton Sirius Matt",
    manifestId: "Dekton-Sirius-Matt",
    hex: "#1A1A1A",
    img: "/materials/tops/Dekton-Sirius-Matt.webp",
    jpg: "/materials/tops/Dekton-Sirius-Matt.jpg",
    multiplier: 1.1,
    repeatUV: [0.5, 0.5],
  },
  CDZM: {
    token: "CDZM",
    label: "Dekton Zenith Matt",
    manifestId: "Dekton-Zenith-Matt",
    hex: "#EEECEA",
    img: "/materials/tops/Dekton-Zenith-Matt.webp",
    jpg: "/materials/tops/Dekton-Zenith-Matt.jpg",
    multiplier: 1.1,
    repeatUV: [0.5, 0.5],
  },
  CMSW: {
    token: "CMSW",
    label: "Marble Super White",
    manifestId: "Marble-Super-White",
    hex: "#EDEAE6",
    img: "/materials/tops/Marble-Super-White.webp",
    jpg: "/materials/tops/Marble-Super-White.jpg",
    multiplier: 1.4,
    repeatUV: [0.5, 0.5],
  },
  CMCA: {
    token: "CMCA",
    label: "Marble Calacatta",
    manifestId: "Marble-Calacatta",
    hex: "#F2EFEA",
    img: "/materials/tops/Marble-Calacatta.webp",
    jpg: "/materials/tops/Marble-Calacatta.jpg",
    multiplier: 1.6,
    repeatUV: [0.5, 0.5],
  },
};

export const DOOR_OPTIONS = Object.keys(DOOR_MATERIALS) as DoorColor[];
export const TOP_OPTIONS = Object.keys(TOP_MATERIALS) as TopColor[];

export interface FinishSelection {
  door: DoorColor;
  top: TopColor;
}

export interface ModulePlacement {
  moduleId: ModuleId;
  x: number;
  y: number;
  rotation?: number;
  note?: string;
}

interface LayoutPlacementDefinition extends ModulePlacement {
  key?: string;
  optional?: boolean;
  roomId?: string;
}

interface LayoutRoomDefinition {
  id: string;
  label: string;
  width: number;
  depth: number;
  origin: { x: number; y: number };
  placements: LayoutPlacementDefinition[];
}

interface LayoutDefinition {
  id: LayoutId;
  name: string;
  summary: string;
  defaultScale: number;
  rooms: LayoutRoomDefinition[];
  removalOrder: string[];
  additionQueue: LayoutPlacementDefinition[];
}

const layout = <T extends LayoutDefinition>(value: T): T => value;

const BACK_KITCHEN_LAYOUT = layout({
  id: "BACK_KITCHEN",
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
        { moduleId: "CAFI", x: 200, y: 0, key: "show:CAFI-1" },
        { moduleId: "CAOV", x: 800, y: 0, key: "show:CAOV-1" },
        { moduleId: "CAMI", x: 1400, y: 0, key: "show:CAMI-1" },
        { moduleId: "BARA", x: 2000, y: 0, key: "show:BARA-1" },
        { moduleId: "BSDD", x: 3200, y: 0, key: "show:BSDD-1" },
        { moduleId: "CSSP", x: 4400, y: 0, key: "show:CSSP-1" },
        { moduleId: "BSSD", x: 5000, y: 0, key: "show:BSSD-1", optional: true },
        {
          moduleId: "ISNA",
          x: 1800,
          y: 1900,
          note: "Show island left",
          key: "show:ISNA-1",
          optional: true,
        },
        {
          moduleId: "ISNA",
          x: 3200,
          y: 1900,
          note: "Show island right",
          key: "show:ISNA-2",
          optional: true,
        },
      ],
    },
    {
      id: "prep",
      label: "Prep Kitchen",
      width: 4500,
      depth: 3000,
      origin: { x: 7000, y: 0 },
      placements: [
        { moduleId: "CSSP", x: 7100, y: 0, key: "prep:CSSP-1" },
        { moduleId: "USDO", x: 7700, y: 0, key: "prep:USDO-1" },
        { moduleId: "BSDD", x: 8300, y: 0, key: "prep:BSDD-1" },
        { moduleId: "BSDR", x: 9500, y: 0, key: "prep:BSDR-1", optional: true },
        { moduleId: "CAFE", x: 10900, y: 0, key: "prep:CAFE-1" },
      ],
    },
  ],
  removalOrder: [
    "show:ISNA-1",
    "show:ISNA-2",
    "show:BSSD-1",
    "prep:BSDR-1",
    "show:BSDD-1",
  ],
  additionQueue: [
    { moduleId: "BADI", roomId: "show", x: 200, y: 0, note: "Upper fridge cab", rotation: 0, optional: true, key: "show:BADI-1" },
    { moduleId: "BADI", roomId: "show", x: 800, y: 0, note: "Upper oven cab", rotation: 0, optional: true, key: "show:BADI-2" },
    { moduleId: "BADI", roomId: "show", x: 2000, y: 0, note: "Upper range cab", rotation: 0, optional: true, key: "show:BADI-3" },
    { moduleId: "BSSD", roomId: "prep", x: 8900, y: 0, note: "Prep single base", optional: true, key: "prep:BSSD-1" },
  ],
} satisfies LayoutDefinition);

const DUAL_ISLAND_LAYOUT = layout({
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
        { moduleId: "CAFI", x: 200, y: 0, key: "primary:CAFI-1" },
        { moduleId: "USDO", x: 800, y: 0, key: "primary:USDO-1" },
        { moduleId: "BARA", x: 1400, y: 0, key: "primary:BARA-1" },
        { moduleId: "BSDD", x: 2600, y: 0, key: "primary:BSDD-1" },
        { moduleId: "CSSP", x: 3800, y: 0, key: "primary:CSSP-1" },
        { moduleId: "CAOV", x: 4400, y: 0, key: "primary:CAOV-1" },
        { moduleId: "CAMI", x: 5000, y: 0, key: "primary:CAMI-1" },
        {
          moduleId: "ISNA",
          x: 1500,
          y: 2000,
          note: "Wet island",
          key: "primary:ISNA-1",
          optional: true,
        },
        {
          moduleId: "ISNA",
          x: 3000,
          y: 2600,
          note: "Dry island",
          key: "primary:ISNA-2",
          optional: true,
        },
      ],
    },
  ],
  removalOrder: ["primary:ISNA-1", "primary:ISNA-2", "primary:BSDD-1"],
  additionQueue: [
    { moduleId: "BADI", roomId: "primary", x: 200, y: 0, note: "Upper fridge cab", key: "primary:BADI-1", optional: true },
    { moduleId: "BADI", roomId: "primary", x: 800, y: 0, note: "Upper dishwasher cab", key: "primary:BADI-2", optional: true },
    { moduleId: "BADI", roomId: "primary", x: 1400, y: 0, note: "Upper range cab", key: "primary:BADI-3", optional: true },
  ],
} satisfies LayoutDefinition);

const BROKEN_PLAN_LAYOUT = layout({
  id: "BROKEN_PLAN",
  name: "Broken Plan Kitchen",
  summary:
    "Partition-ready layout balancing pantry storage and preparation zones.",
  defaultScale: MILLIMETER_TO_PIXEL,
  rooms: [
    {
      id: "primary",
      label: "Broken Plan Kitchen",
      width: 6500,
      depth: 4200,
      origin: { x: 0, y: 0 },
      placements: [
        { moduleId: "CAFI", x: 200, y: 0, key: "primary:CAFI-1" },
        { moduleId: "USDO", x: 800, y: 0, key: "primary:USDO-1" },
        { moduleId: "BARA", x: 1400, y: 0, key: "primary:BARA-1" },
        { moduleId: "BSDD", x: 2600, y: 0, key: "primary:BSDD-1" },
        {
          moduleId: "CSDP",
          x: 3800,
          y: 0,
          note: "Ends at 5056",
          key: "primary:CSDP-1",
        },
        { moduleId: "CAMI", x: 5056, y: 0, key: "primary:CAMI-1" },
        { moduleId: "CAOV", x: 5656, y: 0, key: "primary:CAOV-1" },
        {
          moduleId: "ISNA",
          x: 2600,
          y: 2400,
          key: "primary:ISNA-1",
          optional: true,
        },
      ],
    },
  ],
  removalOrder: ["primary:ISNA-1", "primary:BSDD-1"],
  additionQueue: [
    { moduleId: "BADI", roomId: "primary", x: 200, y: 0, note: "Upper fridge cab", key: "primary:BADI-1", optional: true },
    { moduleId: "BADI", roomId: "primary", x: 800, y: 0, note: "Upper dishwasher cab", key: "primary:BADI-2", optional: true },
    { moduleId: "BADI", roomId: "primary", x: 1400, y: 0, note: "Upper range cab", key: "primary:BADI-3", optional: true },
    { moduleId: "BSSD", roomId: "primary", x: 6200, y: 0, note: "End cap base", key: "primary:BSSD-1", optional: true },
  ],
} satisfies LayoutDefinition);

const DISAPPEARING_LINEAR_LAYOUT = layout({
  id: "DISAPPEARING_LINEAR",
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
        { moduleId: "CSDP", x: 200, y: 0, note: "Ends at 1456", key: "primary:CSDP-1" },
        { moduleId: "CAFI", x: 1456, y: 0, key: "primary:CAFI-1" },
        { moduleId: "CAMI", x: 2056, y: 0, key: "primary:CAMI-1" },
        { moduleId: "CAOV", x: 2656, y: 0, key: "primary:CAOV-1" },
        { moduleId: "BARA", x: 3256, y: 0, key: "primary:BARA-1" },
        { moduleId: "CSSP", x: 4456, y: 0, key: "primary:CSSP-1" },
        {
          moduleId: "ISNA",
          x: 1400,
          y: 2200,
          key: "primary:ISNA-1",
          optional: true,
        },
        {
          moduleId: "ISNA",
          x: 2800,
          y: 2200,
          key: "primary:ISNA-2",
          optional: true,
        },
      ],
    },
  ],
  removalOrder: ["primary:ISNA-1", "primary:ISNA-2"],
  additionQueue: [
    { moduleId: "BADI", roomId: "primary", x: 1456, y: 0, note: "Upper fridge cab", key: "primary:BADI-1", optional: true },
    { moduleId: "BADI", roomId: "primary", x: 2056, y: 0, note: "Upper microwave cab", key: "primary:BADI-2", optional: true },
    { moduleId: "BADI", roomId: "primary", x: 3256, y: 0, note: "Upper range cab", key: "primary:BADI-3", optional: true },
  ],
} satisfies LayoutDefinition);

const LAYOUT_DEFINITIONS: Record<LayoutId, LayoutDefinition> = {
  BACK_KITCHEN: BACK_KITCHEN_LAYOUT,
  DUAL_ISLAND: DUAL_ISLAND_LAYOUT,
  BROKEN_PLAN: BROKEN_PLAN_LAYOUT,
  DISAPPEARING_LINEAR: DISAPPEARING_LINEAR_LAYOUT,
};

export const LAYOUT_OPTIONS = Object.keys(LAYOUT_DEFINITIONS) as LayoutId[];

export interface DesignPlacement extends ModulePlacement {
  id: string;
  roomId: string;
  optional?: boolean;
  source: "base" | "added";
  width: number;
  depth: number;
  height: number;
  category: ModuleCategory;
  key: string;
}

export interface DesignRoom {
  id: string;
  label: string;
  width: number;
  depth: number;
  origin: { x: number; y: number };
  placements: DesignPlacement[];
}

export interface OptimizationOperationBase {
  roomId: string;
  moduleId: ModuleId;
  key?: string;
  note?: string;
}

export type OptimizationOperation =
  | (OptimizationOperationBase & {
      type: "remove" | "add";
      reason: "budget-down" | "budget-up";
    })
  | {
      type: "finish";
      finishType: "door" | "top";
      from: DoorColor | TopColor;
      to: DoorColor | TopColor;
      reason: "budget-down" | "budget-up";
    };

export interface DesignMetadata {
  basePriceUSD: number;
  currentPriceUSD: number;
  targetBudgetUSD?: number | null;
}

export interface Design {
  layout: LayoutId;
  name: string;
  summary: string;
  door: DoorColor;
  top: TopColor;
  rooms: DesignRoom[];
  operations: OptimizationOperation[];
  metadata: DesignMetadata;
  createdAt: string;
}

function createPlacementKey(roomId: string, moduleId: ModuleId, index: number): string {
  return `${roomId}:${moduleId}:${index + 1}`;
}

function cloneDesign(design: Design): Design {
  return {
    layout: design.layout,
    name: design.name,
    summary: design.summary,
    door: design.door,
    top: design.top,
    operations: [...design.operations],
    metadata: { ...design.metadata },
    createdAt: design.createdAt,
    rooms: design.rooms.map((room) => ({
      id: room.id,
      label: room.label,
      width: room.width,
      depth: room.depth,
      origin: { ...room.origin },
      placements: room.placements.map((placement) => ({ ...placement })),
    })),
  };
}

function flattenPlacements(design: Design): DesignPlacement[] {
  return design.rooms.flatMap((room) => room.placements);
}

function resolveDoorMaterial(option: DoorColor): DoorMaterialOption {
  const door = DOOR_MATERIALS[option];
  if (!door) {
    throw new Error(`Unknown door finish: ${option}`);
  }
  return door;
}

function resolveTopMaterial(option: TopColor): TopMaterialOption {
  const top = TOP_MATERIALS[option];
  if (!top) {
    throw new Error(`Unknown top finish: ${option}`);
  }
  return top;
}

export function buildDesign(
  layoutId: LayoutId | LegacyLayoutId,
  door: DoorColor = "DFKW",
  top: TopColor = "CDZM",
): Design {
  const canonical = normalizeLayoutId(layoutId);
  const definition = LAYOUT_DEFINITIONS[canonical];
  if (!definition) {
    throw new Error(`Layout definition missing for ${layoutId}`);
  }

  const doorMaterial = resolveDoorMaterial(door);
  const topMaterial = resolveTopMaterial(top);

  const rooms: DesignRoom[] = definition.rooms.map((room) => {
    const placements: DesignPlacement[] = room.placements.map((placement, index) => {
      const module = MODULES[placement.moduleId];
      if (!module) {
        throw new Error(`Unknown module ${placement.moduleId} in layout ${definition.id}`);
      }
      const key = placement.key ?? createPlacementKey(room.id, placement.moduleId, index);
      return {
        id: `${definition.id}-${room.id}-${key}`,
        key,
        roomId: room.id,
        moduleId: placement.moduleId,
        x: placement.x,
        y: placement.y,
        rotation: placement.rotation,
        note: placement.note,
        optional: placement.optional ?? false,
        source: "base",
        width: module.width,
        depth: module.depth,
        height: module.height,
        category: module.category,
      };
    });

    return {
      id: room.id,
      label: room.label,
      width: room.width,
      depth: room.depth,
      origin: { ...room.origin },
      placements,
    };
  });

  const baseDesign: Design = {
    layout: definition.id,
    name: definition.name,
    summary: definition.summary,
    door: doorMaterial.token as DoorColor,
    top: topMaterial.token as TopColor,
    rooms,
    operations: [],
    metadata: {
      basePriceUSD: 0,
      currentPriceUSD: 0,
    },
    createdAt: new Date().toISOString(),
  };

  const price = priceUSD(baseDesign);
  baseDesign.metadata.basePriceUSD = price;
  baseDesign.metadata.currentPriceUSD = price;

  return baseDesign;
}

export function priceUSD(design: Design): number {
  const placements = flattenPlacements(design);
  const moduleSubtotal = placements.reduce((acc, placement) => {
    const spec = MODULES[placement.moduleId];
    return acc + spec.baseCostUSD;
  }, 0);

  const doorMultiplier = resolveDoorMaterial(design.door).multiplier;
  const topMultiplier = resolveTopMaterial(design.top).multiplier;

  const finishesMultiplier = doorMultiplier * topMultiplier;
  return Math.round(moduleSubtotal * finishesMultiplier);
}

export interface BOMRow {
  moduleId: ModuleId;
  label: string;
  quantity: number;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  unit_cost_usd: number;
  extended_cost_usd: number;
  door_finish: DoorColor;
  top_finish: TopColor;
}

export function bom(design: Design): BOMRow[] {
  const rows = new Map<ModuleId, BOMRow>();
  for (const placement of flattenPlacements(design)) {
    const spec = MODULES[placement.moduleId];
    const existing = rows.get(spec.id);
    if (existing) {
      existing.quantity += 1;
      existing.extended_cost_usd = existing.quantity * spec.baseCostUSD;
    } else {
      rows.set(spec.id, {
        moduleId: spec.id,
        label: spec.label,
        quantity: 1,
        width_mm: spec.width,
        depth_mm: spec.depth,
        height_mm: spec.height,
        unit_cost_usd: spec.baseCostUSD,
        extended_cost_usd: spec.baseCostUSD,
        door_finish: design.door,
        top_finish: design.top,
      });
    }
  }
  return Array.from(rows.values());
}

export interface CutlistRow {
  moduleId: ModuleId;
  component: "cabinet" | "top";
  width_mm: number;
  depth_mm: number;
  thickness_mm: number;
  quantity: number;
}

const PANEL_THICKNESS_MM = 20;

export function cutlist(design: Design): CutlistRow[] {
  const rows: CutlistRow[] = [];
  for (const placement of flattenPlacements(design)) {
    const spec = MODULES[placement.moduleId];
    rows.push({
      moduleId: placement.moduleId,
      component: "cabinet",
      width_mm: spec.width,
      depth_mm: spec.height,
      thickness_mm: PANEL_THICKNESS_MM,
      quantity: 2,
    });
    if (spec.category === "Base" || spec.category === "Snack") {
      rows.push({
        moduleId: placement.moduleId,
        component: "top",
        width_mm: spec.width,
        depth_mm: spec.depth,
        thickness_mm: PANEL_THICKNESS_MM,
        quantity: 1,
      });
    }
  }
  return rows;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function computeBounds(design: Design): Bounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const placement of flattenPlacements(design)) {
    const spec = MODULES[placement.moduleId];
    minX = Math.min(minX, placement.x);
    minY = Math.min(minY, placement.y);
    maxX = Math.max(maxX, placement.x + spec.width);
    maxY = Math.max(maxY, placement.y + spec.depth);
  }

  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 1000;
    maxY = 1000;
  }

  return { minX, minY, maxX, maxY };
}

export function exportSVGPlan(design: Design, mmToPx = 0.1): string {
  const bounds = computeBounds(design);
  const padding = 300; // mm padding
  const minX = bounds.minX - padding;
  const minY = bounds.minY - padding;
  const widthMm = bounds.maxX - bounds.minX + padding * 2;
  const heightMm = bounds.maxY - bounds.minY + padding * 2;

  const widthPx = widthMm * mmToPx;
  const heightPx = heightMm * mmToPx;

  const doorMaterial = resolveDoorMaterial(design.door);
  const topMaterial = resolveTopMaterial(design.top);

  const rects = flattenPlacements(design).map((placement) => {
    const spec = MODULES[placement.moduleId];
    const x = (placement.x - minX) * mmToPx;
    const y = (placement.y - minY) * mmToPx;
    const w = spec.width * mmToPx;
    const h = spec.depth * mmToPx;
    const fill = doorMaterial.hex;
    const stroke = placement.optional ? "#FBBF24" : "#111827";
    const opacity = placement.source === "added" ? 0.85 : 1;
    const label = spec.label;
    return `
      <g transform="translate(${x.toFixed(2)}, ${y.toFixed(2)})" opacity="${opacity.toFixed(2)}">
        <rect width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="16" ry="16" fill="${fill}" stroke="${stroke}" stroke-width="4" />
        <text x="${(w / 2).toFixed(2)}" y="${(h / 2).toFixed(
          2,
        )}" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-size="28" font-family="sans-serif">${label}</text>
      </g>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx.toFixed(2)} ${heightPx.toFixed(
    2,
  )}" width="${widthPx.toFixed(2)}" height="${heightPx.toFixed(2)}">
  <style>
    svg { background: #0f1014; }
  </style>
  <rect x="0" y="0" width="${widthPx.toFixed(2)}" height="${heightPx.toFixed(
    2,
  )}" fill="#0f1014"/>
  <g fill="none" stroke="#1f2937" stroke-width="1">
    ${Array.from({ length: Math.ceil(heightMm / 500) + 1 })
      .map((_, index) => {
        const y = (index * 500 * mmToPx).toFixed(2);
        return `<line x1="0" y1="${y}" x2="${widthPx.toFixed(2)}" y2="${y}" />`;
      })
      .join("\n")}
    ${Array.from({ length: Math.ceil(widthMm / 500) + 1 })
      .map((_, index) => {
        const x = (index * 500 * mmToPx).toFixed(2);
        return `<line x1="${x}" y1="0" x2="${x}" y2="${heightPx.toFixed(2)}" />`;
      })
      .join("\n")}
  </g>
  <g>
    ${rects.join("\n")}
  </g>
  <text x="${(24).toFixed(2)}" y="${(heightPx - 32).toFixed(
    2,
  )}" fill="#D1D5DB" font-size="32" font-family="sans-serif">${design.name} · Door ${doorMaterial.label} · Top ${topMaterial.label} · $${priceUSD(
    design,
  ).toLocaleString()}</text>
</svg>`;
}

export function exportOBJ(design: Design): string {
  const header = [
    "# Kitchen design generated by @repo/design-engine",
    `# Layout: ${design.layout}`,
    `# Door: ${design.door}  Top: ${design.top}`,
  ];
  let vertexIndex = 1;
  const lines: string[] = [...header];

  for (const placement of flattenPlacements(design)) {
    const spec = MODULES[placement.moduleId];
    const x1 = placement.x / 1000;
    const y1 = placement.y / 1000;
    const x2 = (placement.x + spec.width) / 1000;
    const y2 = (placement.y + spec.depth) / 1000;
    const z1 = 0;
    const z2 = spec.height / 1000;

    const vertices = [
      [x1, y1, z1],
      [x2, y1, z1],
      [x2, y2, z1],
      [x1, y2, z1],
      [x1, y1, z2],
      [x2, y1, z2],
      [x2, y2, z2],
      [x1, y2, z2],
    ];
    vertices.forEach((vertex) => {
      lines.push(`v ${vertex.map((value) => value.toFixed(4)).join(" ")}`);
    });

    const faces = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ];
    faces.forEach((face) => {
      const indices = face.map((index) => index + vertexIndex);
      lines.push(`f ${indices.join(" ")}`);
    });

    vertexIndex += 8;
  }

  return `${lines.join("\n")}\n`;
}

function removePlacement(design: Design, key: string): Design | null {
  for (const room of design.rooms) {
    const index = room.placements.findIndex((placement) => placement.key === key);
    if (index >= 0) {
      room.placements.splice(index, 1);
      return design;
    }
  }
  return null;
}

function hasPlacement(design: Design, key: string): boolean {
  return design.rooms.some((room) => room.placements.some((placement) => placement.key === key));
}

function addPlacement(design: Design, placement: LayoutPlacementDefinition, source: "added" | "base"): Design {
  const inferredRoom =
    placement.roomId ??
    (placement.key ? placement.key.split(":")[0] : undefined) ??
    design.rooms[0]?.id;
  if (!inferredRoom) {
    throw new Error(`Unable to infer room for placement addition`);
  }
  const room = design.rooms.find((candidate) => candidate.id === inferredRoom);
  if (!room) {
    throw new Error(`Room ${inferredRoom} not found in design for addition`);
  }
  const module = MODULES[placement.moduleId];
  if (!module) {
    throw new Error(`Unknown module ${placement.moduleId} for addition`);
  }
  const key = placement.key ?? createPlacementKey(roomId, placement.moduleId, room.placements.length);
  room.placements.push({
    id: `${design.layout}-${room.id}-${key}`,
    key,
    roomId: room.id,
    moduleId: placement.moduleId,
    x: placement.x,
    y: placement.y,
    rotation: placement.rotation,
    note: placement.note,
    optional: true,
    source,
    width: module.width,
    depth: module.depth,
    height: module.height,
    category: module.category,
  });
  return design;
}

function cheapestDoor(): DoorColor {
  const [cheapest] = [...DOOR_OPTIONS].sort(
    (a, b) => DOOR_MATERIALS[a].multiplier - DOOR_MATERIALS[b].multiplier,
  );
  return cheapest;
}

function mostPremiumDoor(): DoorColor {
  const [premium] = [...DOOR_OPTIONS].sort(
    (a, b) => DOOR_MATERIALS[b].multiplier - DOOR_MATERIALS[a].multiplier,
  );
  return premium;
}

function cheapestTop(): TopColor {
  const [cheapest] = [...TOP_OPTIONS].sort(
    (a, b) => TOP_MATERIALS[a].multiplier - TOP_MATERIALS[b].multiplier,
  );
  return cheapest;
}

function mostPremiumTop(): TopColor {
  const [premium] = [...TOP_OPTIONS].sort(
    (a, b) => TOP_MATERIALS[b].multiplier - TOP_MATERIALS[a].multiplier,
  );
  return premium;
}

export interface OptimizationResult {
  final: Design;
  ops: OptimizationOperation[];
}

export function optimizeToBudget(
  initialDesign: Design,
  targetBudgetUSD: number,
): OptimizationResult {
  const definition = LAYOUT_DEFINITIONS[initialDesign.layout];
  if (!definition) {
    throw new Error(`Missing layout definition for ${initialDesign.layout}`);
  }

  const design = cloneDesign(initialDesign);
  const ops: OptimizationOperation[] = [];
  const target = Math.max(0, Math.round(targetBudgetUSD));

  let price = priceUSD(design);

  if (target === 0) {
    design.metadata.targetBudgetUSD = target;
    design.metadata.currentPriceUSD = price;
    return { final: design, ops };
  }

  if (price > target) {
    for (const key of definition.removalOrder) {
      if (price <= target) break;
      if (!hasPlacement(design, key)) {
        continue;
      }
      const removed = removePlacement(design, key);
      if (removed) {
        const [roomId, moduleId] = key.split(":") as [string, ModuleId];
        price = priceUSD(design);
        ops.push({
          type: "remove",
          moduleId,
          roomId,
          key,
          reason: "budget-down",
        });
      }
    }
  } else if (price < target) {
    for (const placement of definition.additionQueue) {
      if (price >= target) break;
      const key = placement.key ?? createPlacementKey("addition", placement.moduleId, 0);
      if (hasPlacement(design, key)) {
        continue;
      }
      addPlacement(design, placement, "added");
      const roomId =
        placement.roomId ??
        (placement.key ? placement.key.split(":")[0] : definition.rooms[0].id);
      price = priceUSD(design);
      ops.push({
        type: "add",
        moduleId: placement.moduleId,
        roomId,
        key,
        reason: "budget-up",
      });
    }
  }

  price = priceUSD(design);

  if (price > target) {
    const cheapestDoorOption = cheapestDoor();
    if (design.door !== cheapestDoorOption) {
      const previous = design.door;
      design.door = cheapestDoorOption;
      ops.push({
        type: "finish",
        finishType: "door",
        from: previous,
        to: cheapestDoorOption,
        reason: "budget-down",
      });
      price = priceUSD(design);
    }
  } else if (price < target) {
    const premiumDoor = mostPremiumDoor();
    if (design.door !== premiumDoor) {
      const previous = design.door;
      design.door = premiumDoor;
      ops.push({
        type: "finish",
        finishType: "door",
        from: previous,
        to: premiumDoor,
        reason: "budget-up",
      });
      price = priceUSD(design);
    }
  }

  price = priceUSD(design);

  if (price > target) {
    const cheapestCounter = cheapestTop();
    if (design.top !== cheapestCounter) {
      const previous = design.top;
      design.top = cheapestCounter;
      ops.push({
        type: "finish",
        finishType: "top",
        from: previous,
        to: cheapestCounter,
        reason: "budget-down",
      });
      price = priceUSD(design);
    }
  } else if (price < target) {
    const premiumCounter = mostPremiumTop();
    if (design.top !== premiumCounter) {
      const previous = design.top;
      design.top = premiumCounter;
      ops.push({
        type: "finish",
        finishType: "top",
        from: previous,
        to: premiumCounter,
        reason: "budget-up",
      });
      price = priceUSD(design);
    }
  }

  design.operations.push(...ops);
  design.metadata.currentPriceUSD = price;
  design.metadata.targetBudgetUSD = target;

  return { final: design, ops };
}

export function assertDesignInvariant(design: Design): void {
  const placements = flattenPlacements(design);
  const unique = new Set<string>();
  for (const placement of placements) {
    if (unique.has(placement.id)) {
      throw new Error(`Duplicate placement id detected: ${placement.id}`);
    }
    unique.add(placement.id);
  }
  const recomputedPrice = priceUSD(design);
  if (recomputedPrice !== design.metadata.currentPriceUSD) {
    throw new Error(
      `Design price invariant violated. expected=${design.metadata.currentPriceUSD}, actual=${recomputedPrice}`,
    );
  }
}

export function ensureDeterministicEquality(a: Design, b: Design): boolean {
  const snapshot = (design: Design) => ({
    layout: design.layout,
    door: design.door,
    top: design.top,
    rooms: design.rooms.map((room) => ({
      id: room.id,
      placements: room.placements.map((placement) => ({
        moduleId: placement.moduleId,
        x: placement.x,
        y: placement.y,
      })),
    })),
  });
  return JSON.stringify(snapshot(a)) === JSON.stringify(snapshot(b));
}

export function summarizeDesign(design: Design): {
  layout: LayoutId;
  priceUSD: number;
  modules: number;
  operations: number;
} {
  const placements = flattenPlacements(design);
  return {
    layout: design.layout,
    priceUSD: priceUSD(design),
    modules: placements.length,
    operations: design.operations.length,
  };
}

export function doorMaterial(token: DoorColor): DoorMaterialOption {
  return resolveDoorMaterial(token);
}

export function topMaterial(token: TopColor): TopMaterialOption {
  return resolveTopMaterial(token);
}

export function manifestIdToDoorToken(manifestId: string): DoorColor {
  const entry = DOOR_OPTIONS.find(
    (token) => DOOR_MATERIALS[token].manifestId.toLowerCase() === manifestId.toLowerCase(),
  );
  if (!entry) {
    throw new Error(`Unknown door manifest id: ${manifestId}`);
  }
  return entry;
}

export function manifestIdToTopToken(manifestId: string): TopColor {
  const entry = TOP_OPTIONS.find(
    (token) => TOP_MATERIALS[token].manifestId.toLowerCase() === manifestId.toLowerCase(),
  );
  if (!entry) {
    throw new Error(`Unknown top manifest id: ${manifestId}`);
  }
  return entry;
}


