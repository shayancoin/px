import { create } from "zustand";
import {
  DOOR_FINISH_IDS,
  MAX_LAYOUT_SELECTION,
  MIN_LAYOUT_SELECTION,
  TOP_FINISH_IDS,
  type FinishSelection,
  type LayoutId,
} from "@/domain/spec";

const DEFAULT_LAYOUT: LayoutId = "TWO_X_KITCHEN";
const DEFAULT_FINISHES: FinishSelection = {
  door: DOOR_FINISH_IDS[0] ?? "Fenix-Ingo-Black",
  top: TOP_FINISH_IDS[0] ?? "Dekton-Sirius-Matt",
};

export type GenerationPhase = "idle" | "generating" | "error";

type UIState = {
  selectedLayouts: LayoutId[];
  finishes: FinishSelection;
  phase: GenerationPhase;
  error: string | null;
  setPhase: (phase: GenerationPhase, error?: string | null) => void;
  setSelectedLayouts: (layouts: LayoutId[]) => void;
  toggleLayout: (layout: LayoutId) => void;
  setFinishes: (finishes: FinishSelection) => void;
  updateFinish: (kind: keyof FinishSelection, value: string) => void;
  reset: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  selectedLayouts: [DEFAULT_LAYOUT],
  finishes: DEFAULT_FINISHES,
  phase: "idle",
  error: null,
  setPhase: (phase, error = null) => set({ phase, error }),
  setSelectedLayouts: (layouts) =>
    set({
      selectedLayouts: layouts.slice(0, MAX_LAYOUT_SELECTION),
    }),
  toggleLayout: (layout) =>
    set((state) => {
      const exists = state.selectedLayouts.includes(layout);
      if (exists) {
        if (state.selectedLayouts.length <= MIN_LAYOUT_SELECTION) {
          return state;
        }
        return {
          selectedLayouts: state.selectedLayouts.filter(
            (value) => value !== layout,
          ),
        };
      }

      if (state.selectedLayouts.length >= MAX_LAYOUT_SELECTION) {
        return state;
      }

      return {
        selectedLayouts: [...state.selectedLayouts, layout],
      };
    }),
  setFinishes: (finishes) => set({ finishes }),
  updateFinish: (kind, value) =>
    set((state) => ({
      finishes: {
        ...state.finishes,
        [kind]: value,
      },
    })),
  reset: () =>
    set({
      selectedLayouts: [DEFAULT_LAYOUT],
      finishes: DEFAULT_FINISHES,
      phase: "idle",
      error: null,
    }),
}));



