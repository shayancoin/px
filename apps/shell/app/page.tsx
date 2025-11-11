"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LayoutSelector } from "@/components/LayoutSelector";
import { MaterialPicker } from "@/components/MaterialPicker";
import { useUIStore } from "@/stores/ui";
import { useDesignGenerator } from "@/hooks/useDesignGenerator";
import { useAuth } from "@/components/AuthGate";
import {
  doorTokenToManifestId,
  legacyLayoutId,
  topTokenToManifestId,
  type DoorColor,
  type LayoutId,
  type TopColor,
} from "@/domain/spec";

export default function LandingPage() {
  const { user } = useAuth();
  const { generate } = useDesignGenerator();
  const {
    selectedLayouts,
    finishes,
    phase,
    error,
    updateFinish,
    toggleLayout,
    setFinishes,
    setSelectedLayouts,
  } = useUIStore((state) => ({
    selectedLayouts: state.selectedLayouts,
    finishes: state.finishes,
    phase: state.phase,
    error: state.error,
    updateFinish: state.updateFinish,
    toggleLayout: state.toggleLayout,
    setFinishes: state.setFinishes,
    setSelectedLayouts: state.setSelectedLayouts,
  }));

  const [localError, setLocalError] = useState<string | null>(null);
  const hasAppliedState = useRef(false);

  useEffect(() => {
    if (hasAppliedState.current) {
      return;
    }
    hasAppliedState.current = true;

    try {
      const url = new URL(window.location.href);
      const rawState = url.searchParams.get("state");
      if (!rawState) {
        return;
      }

      const parsed = JSON.parse(rawState) as {
        layout?: string;
        door?: string;
        top?: string;
      } | null;

      if (!parsed || typeof parsed !== "object") {
        return;
      }

      if (typeof parsed.layout === "string") {
        try {
          const legacy = legacyLayoutId(parsed.layout) as LayoutId;
          setSelectedLayouts([legacy]);
        } catch (layoutError) {
          console.warn("Unrecognised layout token from ?state=", layoutError);
        }
      }

      const nextDoor =
        typeof parsed.door === "string"
          ? (() => {
              try {
                return doorTokenToManifestId(parsed.door as DoorColor);
              } catch (doorError) {
                console.warn("Unrecognised door token from ?state=", doorError);
                return null;
              }
            })()
          : null;

      const nextTop =
        typeof parsed.top === "string"
          ? (() => {
              try {
                return topTokenToManifestId(parsed.top as TopColor);
              } catch (topError) {
                console.warn("Unrecognised top token from ?state=", topError);
                return null;
              }
            })()
          : null;

      if (nextDoor || nextTop) {
        setFinishes({
          door: nextDoor ?? finishes.door,
          top: nextTop ?? finishes.top,
        });
      }
    } catch (stateError) {
      console.warn("Unable to parse ?state parameter", stateError);
    }
  }, [finishes.door, finishes.top, setFinishes, setSelectedLayouts]);

  const canGenerate = useMemo(() => {
    return selectedLayouts.length > 0 && phase !== "generating";
  }, [selectedLayouts.length, phase]);

  const handleGenerate = async () => {
    setLocalError(null);
    try {
      await generate();
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate layouts.";
      setLocalError(message);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-14 text-white">
      <section className="flex flex-col gap-6">
        <span className="text-xs uppercase tracking-[0.4em] text-white/40">
          Kitchen-X Configurator
        </span>
        <h1 className="text-4xl font-semibold leading-tight">
          Fuse deterministic kitchen layouts with AI-native variants
        </h1>
        <p className="max-w-2xl text-sm text-white/60">
          Select up to four deterministic floor plans, lock in finishes, and let the
          Kitchen-X LLM generate four optimised cabinet variants per layout. Previews
          render in 2D via Konva, and manufacturing assets trigger post-checkout.
        </p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.4em] text-white/40">
          <span>Auth: Firebase</span>
          <span>Design: Konva 2D</span>
          <span>AI: OpenAI Parallel Worktrees</span>
          <span>Payments: Stripe Checkout</span>
        </div>
      </section>

      {!user && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
          Sign in with Google to start generating layouts.
        </div>
      )}

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <header className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                Step 1
              </span>
              <h2 className="text-lg font-semibold">Select layouts</h2>
            </div>
            <span className="text-xs text-white/50">
              {selectedLayouts.length} selected
            </span>
          </header>
          <LayoutSelector selected={selectedLayouts} onToggle={toggleLayout} />
        </div>

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.4em] text-white/40">
              Step 2
            </span>
            <h2 className="text-lg font-semibold">Finishes</h2>
            <p className="text-xs text-white/50">
              Door and countertop selections influence multiplier pricing during AI
              generation.
            </p>
          </header>
          <MaterialPicker
            selection={finishes}
            onChange={(kind, value) => updateFinish(kind, value)}
          />
        </div>
      </section>

      {(error || localError) && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error ?? localError}
        </div>
      )}

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
        <div className="flex flex-col gap-1 text-white/70">
          <span className="text-xs uppercase tracking-[0.4em]">Summary</span>
          <p className="text-sm">
            {selectedLayouts.length} layout
            {selectedLayouts.length === 1 ? "" : "s"} · Finishes (
            {finishes.door} / {finishes.top})
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium uppercase tracking-wide text-white/70 transition hover:border-white hover:bg-white/10"
          >
            View Dashboard
          </Link>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!user || !canGenerate}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
          >
            {phase === "generating" ? "Generating…" : "Generate Variants"}
          </button>
        </div>
      </section>
    </main>
  );
}
