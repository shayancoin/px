"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { ConfiguratorCanvas } from "@/components/ConfiguratorCanvas";
import { MaterialPicker } from "@/components/MaterialPicker";
import { useAuth } from "@/components/AuthGate";
import { useDesignStore } from "@/stores/design";
import { useDesignSession } from "@/hooks/useDesignSession";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { usePreviewCapture } from "@/hooks/usePreviewCapture";
import { formatUSD } from "@/lib/pricing";
import { persistVariantPlacements } from "@/lib/design";
import { LAYOUTS } from "@/domain/spec";

export default function ConfiguratorPage() {
  const params = useSearchParams();
  const designId = params.get("designId");
  const initialVariantId = params.get("variantId");
  const { user } = useAuth();
  const { initiateCheckout } = useStripeCheckout();
  const { capture, loading: previewLoading, error: previewError } =
    usePreviewCapture();

  useDesignSession(designId);

  const {
    variants,
    selectedVariantId,
    selectVariant,
    loading,
    error,
    updateVariantPlacements,
    updateVariantPreview,
  } = useDesignStore((state) => ({
    variants: state.variants,
    selectedVariantId: state.selectedVariantId,
    selectVariant: state.selectVariant,
    loading: state.loading,
    error: state.error,
    updateVariantPlacements: state.updateVariantPlacements,
    updateVariantPreview: state.updateVariantPreview,
  }));

  const stageRef = useRef<KonvaStage | null>(null);

  useEffect(() => {
    if (initialVariantId) {
      selectVariant(initialVariantId);
    }
  }, [initialVariantId, selectVariant]);

  const activeVariant = useMemo(() => {
    return variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  }, [variants, selectedVariantId]);

  useEffect(() => {
    if (activeVariant && activeVariant.id !== selectedVariantId) {
      selectVariant(activeVariant.id);
    }
  }, [activeVariant, selectedVariantId, selectVariant]);

  if (!designId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-20 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center text-sm text-white/70">
          Missing `designId`. Return to the{" "}
          <a href="/" className="font-semibold text-white underline">
            landing page
          </a>{" "}
          and generate a design.
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-20 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center text-sm text-white/70">
          Sign in to access the configurator.
        </div>
      </main>
    );
  }

  const handlePlacementMove = async (
    placementId: string,
    position: { x: number; y: number },
  ) => {
    if (!activeVariant) return;
    const updatedPlacements = activeVariant.placements.map((placement) =>
      placement.id === placementId
        ? {
            ...placement,
            x: Math.round(position.x),
            y: Math.round(position.y),
          }
        : placement,
    );

    updateVariantPlacements(activeVariant.id, updatedPlacements);
    await persistVariantPlacements(designId, activeVariant.id, updatedPlacements);
  };

  const handleCheckout = async () => {
    if (!activeVariant) return;
    await initiateCheckout({
      designId,
      variantId: activeVariant.id,
    });
  };

  const handlePreviewCapture = async () => {
    if (!activeVariant || !stageRef.current) return;
    try {
      const url = await capture({
        stage: stageRef.current,
        designId,
        variantId: activeVariant.id,
        ownerUid: user.uid,
      });
      updateVariantPreview(activeVariant.id, url);
    } catch (error) {
      console.error("[configurator] preview export failed", error);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-14 text-white">
      <header className="flex flex-col gap-4">
        <span className="text-xs uppercase tracking-[0.4em] text-white/40">
          Configurator
        </span>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">Design {designId}</h1>
            <p className="text-sm text-white/60">
              {variants.length} variant{variants.length === 1 ? "" : "s"} ready • Drag
              modules to refine cabinet positions and regenerate previews at any time.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium uppercase tracking-wide text-white/70 transition hover:border-white hover:bg-white/10"
            >
              Back to Dashboard
            </a>
            <a
              href="/"
              className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium uppercase tracking-wide text-white/70 transition hover:border-white hover:bg-white/10"
            >
              New Layouts
            </a>
          </div>
        </div>
      </header>

      {(error || previewError) && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error ?? previewError}
        </div>
      )}

      {loading || !activeVariant ? (
        <div className="flex h-60 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sm text-white/60">
          Loading design variants…
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-5">
            <nav className="flex flex-wrap gap-3">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    variant.id === activeVariant.id
                      ? "border-white bg-white text-neutral-900"
                      : "border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  {variant.layoutId} · V
                  {variant.variantIndex ?? variants.indexOf(variant) + 1}
                </button>
              ))}
            </nav>

            {LAYOUTS[activeVariant.layoutId]?.rooms.map((room, index) => (
              <ConfiguratorCanvas
                key={room.id}
                room={room}
                placements={activeVariant.placements
                  .filter((placement) => placement.roomId === room.id)
                  .map((placement) => ({
                    id: placement.id,
                    moduleId: placement.moduleId,
                    x: placement.x,
                    y: placement.y,
                    rotation: placement.rotation,
                    option: placement.option,
                    note: placement.note,
                  }))}
                finishes={activeVariant.finishes}
                selectedIds={[]}
                onPlacementMove={handlePlacementMove}
                stageRef={index === 0 ? stageRef : undefined}
              />
            ))}
          </div>

          <aside className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                Variant
              </span>
              <h2 className="text-lg font-semibold text-white">
                {activeVariant.layoutName ?? activeVariant.layoutId} · V
                {activeVariant.variantIndex ?? "?"}
              </h2>
              {activeVariant.rationale && (
                <p className="text-xs text-white/60">{activeVariant.rationale}</p>
              )}
            </div>

            <MaterialPicker
              selection={activeVariant.finishes}
              onChange={(_, __) => undefined}
              readOnly
            />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="flex justify-between">
                <span>Total price</span>
                <span className="font-semibold text-white">
                  {activeVariant.pricing?.totalUSD
                    ? formatUSD(activeVariant.pricing.totalUSD)
                    : "—"}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-xs text-white/50">
                <span>Deposit (20%)</span>
                <span>
                  {activeVariant.pricing?.depositUSD
                    ? formatUSD(activeVariant.pricing.depositUSD)
                    : "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-white/50">
              <button
                type="button"
                onClick={handleCheckout}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
              >
                Proceed to Deposit
              </button>
              <button
                type="button"
                onClick={handlePreviewCapture}
                disabled={previewLoading}
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {previewLoading ? "Exporting…" : "Export Preview"}
              </button>
              {activeVariant.previewUrl && (
                <a
                  href={activeVariant.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white underline"
                >
                  View latest preview
                </a>
              )}
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

