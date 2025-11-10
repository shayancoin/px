import { create } from "zustand";
import type { FinishSelection, LayoutId, ModuleId } from "@/domain/spec";
import type { PricingBreakdown } from "@/lib/pricing";

export type VariantPlacement = {
  id: string;
  roomId: string;
  moduleId: ModuleId;
  x: number;
  y: number;
  rotation?: number;
  option?: string;
  note?: string;
};

export type VariantRecord = {
  id: string;
  designId: string;
  layoutId: LayoutId;
  layoutName?: string;
  variantIndex?: number;
  placements: VariantPlacement[];
  finishes: FinishSelection;
  pricing?: PricingBreakdown;
  rationale?: string;
  previewUrl?: string | null;
  orderStatus?: string | null;
};

type DesignState = {
  designId: string | null;
  variants: VariantRecord[];
  selectedVariantId: string | null;
  loading: boolean;
  error: string | null;
  setDesignId: (designId: string | null) => void;
  setVariants: (variants: VariantRecord[]) => void;
  upsertVariant: (variant: VariantRecord) => void;
  selectVariant: (variantId: string | null) => void;
  updateVariantPlacements: (
    variantId: string,
    placements: VariantPlacement[],
  ) => void;
  updateVariantPreview: (variantId: string, previewUrl: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

export const useDesignStore = create<DesignState>((set) => ({
  designId: null,
  variants: [],
  selectedVariantId: null,
  loading: false,
  error: null,
  setDesignId: (designId) =>
    set({
      designId,
      selectedVariantId: null,
      variants: [],
    }),
  setVariants: (variants) =>
    set((state) => ({
      variants,
      selectedVariantId:
        state.selectedVariantId && variants.some((v) => v.id === state.selectedVariantId)
          ? state.selectedVariantId
          : variants[0]?.id ?? null,
    })),
  upsertVariant: (variant) =>
    set((state) => {
      const existingIndex = state.variants.findIndex((v) => v.id === variant.id);
      if (existingIndex === -1) {
        const nextVariants = [...state.variants, variant];
        return {
          variants: nextVariants,
          selectedVariantId: state.selectedVariantId ?? variant.id,
        };
      }

      const nextVariants = [...state.variants];
      nextVariants[existingIndex] = variant;
      return { variants: nextVariants };
    }),
  selectVariant: (variantId) =>
    set({
      selectedVariantId: variantId,
    }),
  updateVariantPlacements: (variantId, placements) =>
    set((state) => ({
      variants: state.variants.map((variant) =>
        variant.id === variantId ? { ...variant, placements } : variant,
      ),
    })),
  updateVariantPreview: (variantId, previewUrl) =>
    set((state) => ({
      variants: state.variants.map((variant) =>
        variant.id === variantId ? { ...variant, previewUrl } : variant,
      ),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      designId: null,
      variants: [],
      selectedVariantId: null,
      loading: false,
      error: null,
    }),
}));



