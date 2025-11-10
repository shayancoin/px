"use client";

import Link from "next/link";
import { DashboardTable } from "@/components/DashboardTable";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

export default function DashboardPage() {
  const { designsWithVariants, orders, loading, error } = useDashboardData();
  const { initiateCheckout, loading: stripeLoading, error: stripeError } =
    useStripeCheckout();

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

      {stripeLoading && (
        <div className="fixed bottom-6 right-6 rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 backdrop-blur">
          Redirecting to Stripe Checkout…
        </div>
      )}
    </main>
  );
}



