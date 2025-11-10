"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  collection,
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirestoreError,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthGate";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { FinishSelection, LayoutId } from "@/domain/spec";
import type { PricingBreakdown } from "@/lib/pricing";

function tsToDate(timestamp: Timestamp | undefined): Date | undefined {
  if (!timestamp) {
    return undefined;
  }
  return timestamp.toDate();
}

export interface VariantDocument {
  id: string;
  designId: string;
  layoutId: LayoutId;
  layoutName?: string;
  variantIndex?: number;
  pricing?: PricingBreakdown;
  orderStatus?: string;
  previewUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  stripeSessionId?: string | null;
}

export interface DesignDocument {
  id: string;
  ownerUid: string;
  selectedLayouts: LayoutId[];
  finishes: FinishSelection;
  createdAt?: Date;
  updatedAt?: Date;
  lastGeneratedAt?: Date;
  lastOrderAt?: Date;
  lastOrderStatus?: string;
}

export interface OrderDocument {
  id: string;
  designId?: string | null;
  variantId?: string | null;
  ownerUid?: string | null;
  status: string;
  amountUSD?: number | null;
  currency?: string;
  createdAt?: Date;
  updatedAt?: Date;
  paidAt?: Date;
}

export interface DashboardState {
  designs: DesignDocument[];
  variants: VariantDocument[];
  orders: OrderDocument[];
  designsWithVariants: Array<DesignDocument & { variants: VariantDocument[] }>;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardState {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<DesignDocument[]>([]);
  const [variants, setVariants] = useState<VariantDocument[]>([]);
  const [orders, setOrders] = useState<OrderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDesigns([]);
      setVariants([]);
      setOrders([]);
      setLoading(false);
      return;
    }

    const db = getFirestoreClient();
    setLoading(true);

    const handleError = (err: FirestoreError) => {
      console.error("[dashboard] firestore error", err);
      setError(err.message);
    };

    const unsubscribers: Array<() => void> = [];

    const designsQuery = query(
      collection(db, "designs"),
      where("ownerUid", "==", user.uid),
      orderBy("updatedAt", "desc"),
    );

    unsubscribers.push(
      onSnapshot(
        designsQuery,
        (snapshot) => {
          setDesigns(
            snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ownerUid: data.ownerUid,
                selectedLayouts: data.selectedLayouts ?? [],
                finishes: data.finishes ?? {},
                createdAt: tsToDate(data.createdAt),
                updatedAt: tsToDate(data.updatedAt),
                lastGeneratedAt: tsToDate(data.lastGeneratedAt),
                lastOrderAt: tsToDate(data.lastOrderAt),
                lastOrderStatus: data.lastOrderStatus ?? null,
              };
            }),
          );
        },
        handleError,
      ),
    );

    const variantsQuery = query(
      collectionGroup(db, "variants"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    unsubscribers.push(
      onSnapshot(
        variantsQuery,
        (snapshot) => {
          setVariants(
            snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                designId: data.designId,
                layoutId: data.layoutId,
                layoutName: data.layoutName,
                variantIndex: data.variantIndex,
                pricing: data.pricing,
                orderStatus: data.orderStatus ?? null,
                previewUrl: data.previewUrl ?? null,
                createdAt: tsToDate(data.createdAt),
                updatedAt: tsToDate(data.updatedAt),
                stripeSessionId: data.stripeSessionId ?? null,
              };
            }),
          );
        },
        handleError,
      ),
    );

    const ordersQuery = query(
      collection(db, "orders"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    unsubscribers.push(
      onSnapshot(
        ordersQuery,
        (snapshot) => {
          setOrders(
            snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                designId: data.designId ?? null,
                variantId: data.variantId ?? null,
                ownerUid: data.ownerUid ?? null,
                status: data.status ?? "pending",
                amountUSD: data.amountUSD ?? data.totals?.depositUSD ?? null,
                currency: data.currency ?? "USD",
                createdAt: tsToDate(data.createdAt),
                updatedAt: tsToDate(data.updatedAt),
                paidAt: tsToDate(data.paidAt),
              };
            }),
          );
        },
        handleError,
      ),
    );

    setLoading(false);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  const designsWithVariants = useMemo(() => {
    const variantMap = variants.reduce<Record<string, VariantDocument[]>>(
      (acc, variant) => {
        const list = acc[variant.designId] ?? [];
        list.push(variant);
        acc[variant.designId] = list;
        return acc;
      },
      {},
    );

    return designs.map((design) => ({
      ...design,
      variants: variantMap[design.id] ?? [],
    }));
  }, [designs, variants]);

  return {
    designs,
    variants,
    orders,
    designsWithVariants,
    loading,
    error,
  };
}

