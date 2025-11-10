"use client";

import { useEffect } from "react";
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore";
import { useAuth } from "@/components/AuthGate";
import { getFirestoreClient } from "@/lib/firebase/client";
import { useDesignStore, type VariantPlacement } from "@/stores/design";
import type { VariantRecord } from "@/stores/design";
import type { LayoutId } from "@/domain/spec";
import type { FinishSelection } from "@/domain/spec";

type DesignDocument = {
  ownerUid: string;
  finishes: FinishSelection;
  selectedLayouts: LayoutId[];
};

type VariantDocument = {
  layoutId: LayoutId;
  layoutName?: string;
  variantIndex?: number;
  placements?: Array<{
    id?: string;
    roomId: string;
    moduleId: string;
    x: number;
    y: number;
    rotation?: number;
    option?: string;
    note?: string;
  }>;
  finishes?: FinishSelection;
  pricing?: VariantRecord["pricing"];
  rationale?: string;
  previewUrl?: string;
  orderStatus?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

function convertPlacements(
  designId: string,
  variantId: string,
  placements: VariantDocument["placements"],
): VariantPlacement[] {
  if (!placements) return [];

  return placements.map((placement, index) => ({
    id:
      placement.id ??
      `${designId}-${variantId}-${placement.moduleId}-${index}`,
    roomId: placement.roomId,
    moduleId: placement.moduleId,
    x: Math.round(placement.x),
    y: Math.round(placement.y),
    rotation: placement.rotation,
    option: placement.option,
    note: placement.note,
  }));
}

export function useDesignSession(designId: string | null) {
  const { user } = useAuth();
  const store = useDesignStore();

  useEffect(() => {
    if (!designId || !user) {
      store.reset();
      return;
    }

    store.setDesignId(designId);

    const firestore = getFirestoreClient();
    const designRef = doc(firestore, "designs", designId);
    const variantsRef = collection(firestore, "designs", designId, "variants");
    store.setLoading(true);

    const unsubscribeDesign = onSnapshot(
      designRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          store.setError("Design not found.");
          store.setLoading(false);
          return;
        }

        const data = snapshot.data() as DesignDocument;
        if (data.ownerUid !== user.uid) {
          store.setError("You do not have access to this design.");
          store.setLoading(false);
        }
      },
      (error: FirestoreError) => {
        store.setError(error.message);
        store.setLoading(false);
      },
    );

    const variantsQuery = query(
      variantsRef,
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "asc"),
    );

    const unsubscribeVariants = onSnapshot(
      variantsQuery,
      (snapshot) => {
        const variants: VariantRecord[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData & VariantDocument;
          return {
            id: docSnapshot.id,
            designId,
            layoutId: data.layoutId,
            layoutName: data.layoutName,
            variantIndex: data.variantIndex,
            placements: convertPlacements(
              designId,
              docSnapshot.id,
              data.placements,
            ),
            finishes: data.finishes ?? { door: "", top: "" },
            pricing: data.pricing,
            rationale: data.rationale,
            previewUrl: data.previewUrl ?? null,
            orderStatus: data.orderStatus ?? null,
          };
        });

        store.setVariants(variants);
        store.setLoading(false);
      },
      (error: FirestoreError) => {
        store.setError(error.message);
        store.setLoading(false);
      },
    );

    return () => {
      unsubscribeDesign();
      unsubscribeVariants();
    };
  }, [designId, store, user]);
}

