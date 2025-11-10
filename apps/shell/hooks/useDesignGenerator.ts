"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthGate";
import { useUIStore } from "@/stores/ui";
import { useDesignStore, type VariantPlacement } from "@/stores/design";
import type { VariantRecord } from "@/stores/design";
import type { LayoutId } from "@/domain/spec";

type FuseApiVariant = {
  layoutId: LayoutId;
  variantId: string;
  variantIndex?: number;
  placements: Array<{
    roomId: string;
    moduleId?: string;
    type?: string;
    x: number;
    y: number;
    rotation?: number;
    option?: string;
    note?: string;
  }>;
  rationale?: string;
  pricing?: VariantRecord["pricing"];
};

type FuseApiResponse = {
  designId: string;
  variants: FuseApiVariant[];
};

function toVariantPlacements(
  designId: string,
  variantId: string,
  placements: FuseApiVariant["placements"],
): VariantPlacement[] {
  return placements.map((placement, index) => {
    const moduleId = (placement.type ?? placement.moduleId ?? "").toUpperCase();
    const token = `${designId}-${variantId}-${moduleId}-${index}`;
    return {
      id: token,
      roomId: placement.roomId,
      moduleId: moduleId as VariantPlacement["moduleId"],
      x: Math.round(placement.x),
      y: Math.round(placement.y),
      rotation: placement.rotation,
      option: placement.option,
      note: placement.note,
    };
  });
}

export function useDesignGenerator() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const uiStore = useUIStore();
  const designStore = useDesignStore();

  // Workaround because we destructured setPhase incorrectly earlier
  const updatePhase = useCallback(
    (phase: "idle" | "generating" | "error", error?: string | null) => {
      useUIStore.setState({ phase, error: error ?? null });
    },
    [],
  );

  const generate = useCallback(
    async (overrideLayouts?: LayoutId[]) => {
      const layouts = overrideLayouts ?? uiStore.selectedLayouts;
      if (!user) {
        updatePhase("error", "Authentication required to generate layouts.");
        throw new Error("User not authenticated.");
      }

      if (layouts.length === 0) {
        updatePhase("error", "Select at least one layout.");
        throw new Error("No layouts selected.");
      }

      const designId = crypto.randomUUID();
      updatePhase("generating", null);
      designStore.reset();
      designStore.setDesignId(designId);
      designStore.setLoading(true);

      try {
        const idToken = await getIdToken();
        if (!idToken) {
          throw new Error("Failed to resolve ID token.");
        }

        const response = await fetch("/api/llm/fuse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            designId,
            layouts,
            finishes: uiStore.finishes,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "Fusion API request failed.");
        }

        const payload = (await response.json()) as FuseApiResponse;

        const variants: VariantRecord[] = payload.variants.map((variant) => ({
          id: variant.variantId,
          designId: payload.designId,
          layoutId: variant.layoutId,
          layoutName: undefined,
          variantIndex: variant.variantIndex,
          placements: toVariantPlacements(
            payload.designId,
            variant.variantId,
            variant.placements,
          ),
          finishes: uiStore.finishes,
          pricing: variant.pricing,
          rationale: variant.rationale,
          previewUrl: null,
        }));

        designStore.setVariants(variants);
        designStore.setLoading(false);
        updatePhase("idle", null);

        router.push(`/configurator?designId=${payload.designId}`);
        return payload.designId;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Layout generation failed.";
        designStore.setError(message);
        designStore.setLoading(false);
        updatePhase("error", message);
        throw error;
      }
    },
    [designStore, getIdToken, router, uiStore.finishes, uiStore.selectedLayouts, updatePhase, user],
  );

  return {
    generate,
  };
}

