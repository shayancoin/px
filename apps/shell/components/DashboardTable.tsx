"use client";

import Link from "next/link";
import { formatUSD } from "@/lib/pricing";
import type {
  DashboardState,
  OrderDocument,
  VariantDocument,
} from "@/hooks/useDashboardData";

type DesignRow = DashboardState["designsWithVariants"][number];

type DashboardTableProps = {
  designs: DesignRow[];
  orders: OrderDocument[];
  onCheckout?: (designId: string, variantId: string) => void;
};

function formatDate(date?: Date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getVariantStatus(variant: VariantDocument) {
  const status = variant.orderStatus ?? "draft";
  switch (status) {
    case "paid":
      return { label: "Paid", className: "bg-emerald-500/10 text-emerald-300" };
    case "processing":
      return { label: "Processing", className: "bg-amber-500/10 text-amber-300" };
    case "draft":
    default:
      return { label: "Draft", className: "bg-zinc-500/10 text-zinc-300" };
  }
}

export function DashboardTable({
  designs,
  orders,
  onCheckout,
}: DashboardTableProps) {
  const hasDesigns = designs.length > 0;
  const hasOrders = orders.length > 0;

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 backdrop-blur">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Design Variants</h2>
            <p className="text-sm text-white/60">
              Manage generated variants, preview canvases, and initiate deposits.
            </p>
          </div>
          <Link
            href="/configurator"
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-900 transition hover:bg-white/90"
          >
            Create New Design
          </Link>
        </header>

        {hasDesigns ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm text-white/80">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Design</th>
                  <th className="px-4 py-3 font-medium">Variant</th>
                  <th className="px-4 py-3 font-medium">Deposit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {designs.map((design) =>
                  design.variants.map((variant) => {
                    const deposit =
                      variant.pricing?.depositUSD ?? variant.pricing?.totalUSD ?? 0;
                    const { label, className } = getVariantStatus(variant);
                    return (
                      <tr key={`${design.id}-${variant.id}`} className="hover:bg-white/5">
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-white">
                              {design.id}
                            </span>
                            <span className="text-xs text-white/50">
                              Layouts: {design.selectedLayouts.join(", ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-white">
                              {variant.layoutName ?? variant.layoutId}
                            </span>
                            <span className="text-xs text-white/50">
                              Variant #{variant.variantIndex ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-sm font-semibold text-white">
                          {deposit > 0 ? formatUSD(deposit) : "—"}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}
                          >
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-sm text-white/60">
                          {formatDate(variant.updatedAt ?? design.updatedAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/configurator?designId=${design.id}&variantId=${variant.id}`}
                              className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-white hover:bg-white/10"
                            >
                              Open Configurator
                            </Link>
                            <button
                              type="button"
                              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/40"
                              onClick={() =>
                                onCheckout?.(design.id, variant.id)
                              }
                              disabled={!onCheckout || label !== "Draft"}
                            >
                              Collect Deposit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 text-center text-white/60">
            <p className="text-sm">
              No designs yet. Generate your first layout variant to see it here.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 backdrop-blur">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Orders</h2>
            <p className="text-sm text-white/60">
              Track deposit status and downstream manufacturing fulfilment.
            </p>
          </div>
        </header>

        {hasOrders ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm text-white/80">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Design</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {order.id}
                    </td>
                    <td className="px-4 py-4 text-sm text-white/70">
                      {order.designId ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-white">
                      {order.amountUSD ? formatUSD(order.amountUSD) : "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-white/70">
                      {order.status}
                    </td>
                    <td className="px-4 py-4 text-sm text-white/60">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 text-center text-white/60">
            <p className="text-sm">
              No orders recorded yet. Collect a deposit to populate this table.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}



