"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardTable } from "@/components/DashboardTable";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

export default function DashboardPage() {
  const { designsWithVariants, orders, loading, error } = useDashboardData();
  const { initiateCheckout, loading: stripeLoading, error: stripeError } =
    useStripeCheckout();
  const [localGenerations, setLocalGenerations] = useState<
    Array<{
      run_id: string;
      ts: number;
      layouts?: string[];
      perLayout?: number;
      useLLM?: boolean;
    }>
  >([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kc:generations");
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLocalGenerations(parsed);
      }
    } catch (storageError) {
      console.warn("Unable to read local generation history", storageError);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-14">
      <header className="flex flex-col gap-4 text-white">
        <span className="text-xs uppercase tracking-[0.4em] text-white/50">
          Kitchen-X Control
        </span>
        <h1 className="text-3xl font-semibold leading-tight">
          Dashboard overview
        </h1>
        <p className="max-w-2xl text-sm text-white/60">
          Review generated layouts, manage deposits, and access manufacturing-ready
          deliverables once payment is confirmed.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/configurator"
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium uppercase tracking-wide text-white/70 transition hover:border-white hover:bg-white/10"
          >
            Return to Configurator
          </Link>
        </div>
      </header>

      {(error || stripeError) && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error ?? stripeError}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sm text-white/60">
          Synchronising dashboard data…
        </div>
      ) : (
        <DashboardTable
          designs={designsWithVariants}
          orders={orders}
          onCheckout={(designId, variantId) =>
            initiateCheckout({ designId, variantId })
          }
        />
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
        <header className="flex flex-col gap-1 text-white">
          <span className="text-xs uppercase tracking-[0.4em] text-white/40">
            Offline Runs
          </span>
          <h2 className="text-lg font-semibold">Local generation history</h2>
          <p className="text-xs text-white/60">
            Captured from this browser when invoking the /variants generator. Runs
            persist offline until cleared.
          </p>
        </header>
        {localGenerations.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">No local runs yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            {localGenerations
              .slice()
              .reverse()
              .map((run) => (
                <li
                  key={`${run.run_id}-${run.ts}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-[0.4em] text-white/40">
                      {new Date(run.ts).toLocaleString()}
                    </span>
                    <span className="font-semibold text-white">
                      Run {run.run_id}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-xs text-white/60">
                    <span>
                      Layouts: {(run.layouts ?? []).join(", ") || "all"}
                    </span>
                    <span>Variants/Layout: {run.perLayout ?? 4}</span>
                    <span>Mode: {run.useLLM ? "LLM" : "Deterministic"}</span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      {stripeLoading && (
        <div className="fixed bottom-6 right-6 rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 backdrop-blur">
          Redirecting to Stripe Checkout…
        </div>
      )}
    </main>
  );
}



