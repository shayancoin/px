"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  LAYOUT_LIST,
  MAX_LAYOUT_SELECTION,
  MIN_LAYOUT_SELECTION,
  type LayoutId,
} from "@/domain/spec";
import { exportSVGPlan, type Design } from "@repo/design-engine";

type ApiVariant = {
  variant_id: string;
  layout: string;
  layout_canonical: string;
  price_usd: number;
  ops_count: number;
  operations: Array<{ type: string; from: string; to: string; delta: number }>;
  files: {
    root: string;
    designJson: string;
    planSvg: string;
    modelObj: string;
    bomCsv: string;
    cutCsv: string;
  };
  design: Design;
};

type ApiResponse = {
  ok: boolean;
  run_id: string;
  results: Record<string, ApiVariant[]>;
  useLLM?: boolean;
};

const DEFAULT_LAYOUT = ((): LayoutId => {
  const fallback = LAYOUT_LIST[0]?.id;
  return fallback ?? "DUAL_ISLAND";
})();

export default function VariantsPage() {
  const [selectedLayouts, setSelectedLayouts] = useState<Set<LayoutId>>(
    () => new Set<LayoutId>([DEFAULT_LAYOUT]),
  );
  const [perLayout, setPerLayout] = useState(4);
  const [budget, setBudget] = useState<string>("");
  const [useLLM, setUseLLM] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layouts = useMemo(() => Array.from(selectedLayouts), [selectedLayouts]);

  const toggleLayout = (layoutId: LayoutId) => {
    setSelectedLayouts((prev) => {
      const next = new Set(prev);
      if (next.has(layoutId)) {
        if (next.size <= MIN_LAYOUT_SELECTION) {
          return next;
        }
        next.delete(layoutId);
        return next;
      }
      if (next.size >= MAX_LAYOUT_SELECTION) {
        return next;
      }
      next.add(layoutId);
      return next;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const requestBody = {
        layouts,
        perLayout,
        budget: budget ? Number.parseInt(budget, 10) || undefined : undefined,
        useLLM,
      };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const payload = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error ?? "Generation request failed.");
      }
      setResponse(payload);
      try {
        const key = "kc:generations";
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
        existing.push({
          ts: Date.now(),
          run_id: payload.run_id,
          layouts,
          perLayout,
          useLLM: payload.useLLM ?? false,
        });
        localStorage.setItem(key, JSON.stringify(existing.slice(-20)));
      } catch {
        // ignore storage errors
      }
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate variants.";
      setError(message);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-14 text-white">
      <section className="flex flex-col gap-4">
        <span className="text-xs uppercase tracking-[0.4em] text-white/40">
          Worktree Generator
        </span>
        <h1 className="text-3xl font-semibold leading-tight">
          Deterministic multi-layout variant generation
        </h1>
        <p className="max-w-3xl text-sm text-white/60">
          Select canonical layouts, choose the number of deterministic variants, and
          trigger the generation engine. Each variant persists to an on-disk worktree
          with JSON, SVG, OBJ, BOM, and cut list artifacts. LLM expansion is gated by
          environment keys—fallback remains purely deterministic.
        </p>
      </section>

      <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 px-8 py-6 backdrop-blur lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <header className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.4em] text-white/40">
              Layouts
            </span>
            <span className="text-xs text-white/50">
              {layouts.length} selected · {MIN_LAYOUT_SELECTION} – {MAX_LAYOUT_SELECTION}
            </span>
          </header>
          <div className="grid gap-3 md:grid-cols-2">
            {LAYOUT_LIST.map((layout) => {
              const isSelected = selectedLayouts.has(layout.id);
              const disabled =
                !isSelected && selectedLayouts.size >= MAX_LAYOUT_SELECTION;
              return (
                <label
                  key={layout.id}
                  className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-3 transition ${
                    isSelected
                      ? "border-white bg-white/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                  } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleLayout(layout.id)}
                      className="h-4 w-4 rounded"
                      disabled={disabled}
                    />
                    <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                      {layout.id.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{layout.name}</h3>
                    <p className="text-xs text-white/60">{layout.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-white/50">
                    {layout.rooms.map((room) => (
                      <span key={room.id}>
                        {room.label}: {room.width}×{room.depth} mm
                      </span>
                    ))}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <header className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.4em] text-white/40">
              Parameters
            </span>
            <h2 className="text-base font-semibold">Variant controls</h2>
          </header>
          <label className="flex flex-col gap-1 text-sm text-white/70">
            <span>Variants per layout</span>
            <input
              type="number"
              min={1}
              max={4}
              value={perLayout}
              onChange={(event) => setPerLayout(Number.parseInt(event.target.value, 10) || 1)}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-white/70">
            <span>Budget target (USD)</span>
            <input
              type="number"
              min={1}
              placeholder="auto"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-white"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={useLLM}
              onChange={(event) => setUseLLM(event.target.checked)}
              className="h-4 w-4 rounded"
            />
            Enable LLM path (requires GEMINI_API_KEY)
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || layouts.length === 0}
            className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
          >
            {loading ? "Generating…" : "Generate variants"}
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {response && (
        <section className="flex flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1 text-white/70">
              <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                Run ID
              </span>
              <code className="rounded-full bg-white/10 px-3 py-1 text-xs">
                {response.run_id}
              </code>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/50">
              <span>{layouts.length} layouts</span>
              <span>{perLayout} variants per layout</span>
              <span>Mode: {response.useLLM ? "LLM" : "Deterministic"}</span>
            </div>
          </header>

          <div className="flex flex-col gap-10">
            {Object.entries(response.results).map(([layoutKey, variants]) => (
              <div key={layoutKey} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {layoutKey.replace(/_/g, " ")} · {variants.length} variant
                    {variants.length === 1 ? "" : "s"}
                  </h2>
                  <span className="text-xs text-white/50">
                    {variants.reduce((acc, variant) => acc + variant.price_usd, 0).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {variants.map((variant) => {
                    let svgDoc: string | null = null;
                    try {
                      svgDoc = exportSVGPlan(variant.design, 0.12);
                    } catch {
                      svgDoc = null;
                    }
                    return (
                      <article
                        key={variant.variant_id}
                        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-semibold">{variant.variant_id}</h3>
                            <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                              {variant.layout_canonical}
                            </span>
                          </div>
                          <div className="text-right text-sm text-white">
                            ${variant.price_usd.toLocaleString()}
                          </div>
                        </div>

                        {svgDoc ? (
                          <iframe
                            title={variant.variant_id}
                            srcDoc={svgDoc}
                            className="h-64 w-full rounded-2xl border border-white/10 bg-neutral-900"
                          />
                        ) : (
                          <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-neutral-900 text-sm text-white/50">
                            Preview unavailable
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const state = encodeURIComponent(JSON.stringify(variant.design));
                              window.location.href = `/?state=${state}`;
                            }}
                            className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
                          >
                            Customize colors
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                const key = "kc:saves";
                                const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
                                existing.push({
                                  id: variant.variant_id,
                                  design: variant.design,
                                  price: variant.price_usd,
                                  createdAt: Date.now(),
                                });
                                localStorage.setItem(key, JSON.stringify(existing.slice(-50)));
                                alert("Saved to local dashboard storage.");
                              } catch {
                                alert("Unable to save locally.");
                              }
                            }}
                            className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
                          >
                            Save to dashboard
                          </button>
                          <Link
                            href="/dashboard"
                            className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
                          >
                            Dashboard →
                          </Link>
                        </div>

                        <details className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                          <summary className="cursor-pointer text-white/80">
                            Files
                          </summary>
                          <ul className="mt-2 flex flex-col gap-1 break-all">
                            <li>{variant.files.designJson}</li>
                            <li>{variant.files.planSvg}</li>
                            <li>{variant.files.modelObj}</li>
                            <li>{variant.files.bomCsv}</li>
                            <li>{variant.files.cutCsv}</li>
                          </ul>
                        </details>

                        {variant.operations.length > 0 && (
                          <details className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                            <summary className="cursor-pointer text-white/80">
                              Optimisation operations ({variant.ops_count})
                            </summary>
                            <ul className="mt-2 flex flex-col gap-1">
                              {variant.operations.map((operation, index) => (
                                <li key={index}>
                                  <span className="font-semibold uppercase text-white/70">
                                    {operation.type}
                                  </span>{" "}
                                  {operation.from} → {operation.to} (
                                  {operation.delta >= 0 ? "+" : ""}
                                  {operation.delta})
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/40">
        <span>Deterministic worktree generator · Offline-first</span>
        <Link href="/" className="underline underline-offset-4 hover:text-white/70">
          Back to configurator
        </Link>
      </footer>
    </main>
  );
}


