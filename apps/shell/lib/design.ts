import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import type { VariantPlacement } from "@/stores/design";

export async function persistVariantPlacements(
  designId: string,
  variantId: string,
  placements: VariantPlacement[],
) {
  const firestore = getFirestoreClient();
  const variantRef = doc(firestore, "designs", designId, "variants", variantId);
  await updateDoc(variantRef, {
    placements: placements.map((placement) => ({
      id: placement.id,
      roomId: placement.roomId,
      moduleId: placement.moduleId,
      x: placement.x,
      y: placement.y,
      rotation: placement.rotation ?? null,
      option: placement.option ?? null,
      note: placement.note ?? null,
    })),
    updatedAt: serverTimestamp(),
  });
}



