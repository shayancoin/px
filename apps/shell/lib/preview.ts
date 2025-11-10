"use client";

import type { Stage } from "konva/lib/Stage";
import {
  doc,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";
import { getFirestoreClient } from "@/lib/firebase/client";
import { getFirebaseStorage } from "@/lib/firebase/client";

type SavePreviewParams = {
  stage: Stage;
  designId: string;
  variantId: string;
  ownerUid: string;
};

function dataUrlToBlob(dataUrl: string) {
  return fetch(dataUrl).then((res) => res.blob());
}

function getStorageRefs(
  storage: FirebaseStorage,
  ownerUid: string,
  designId: string,
  variantId: string,
) {
  const path = `previews/${ownerUid}/${designId}/${variantId}.png`;
  return ref(storage, path);
}

function getVariantDoc(
  firestore: Firestore,
  designId: string,
  variantId: string,
) {
  return doc(firestore, "designs", designId, "variants", variantId);
}

export async function saveVariantPreview({
  stage,
  designId,
  variantId,
  ownerUid,
}: SavePreviewParams) {
  const dataUrl = stage.toDataURL({
    mimeType: "image/png",
    pixelRatio: 2,
  });

  const blob = await dataUrlToBlob(dataUrl);

  const storage = getFirebaseStorage();
  const firestore = getFirestoreClient();
  const storageRef = getStorageRefs(storage, ownerUid, designId, variantId);

  await uploadBytes(storageRef, blob, {
    contentType: "image/png",
    cacheControl: "public, max-age=604800",
  });

  const downloadUrl = await getDownloadURL(storageRef);

  const variantDoc = getVariantDoc(firestore, designId, variantId);
  await updateDoc(variantDoc, {
    previewUrl: downloadUrl,
    previewUpdatedAt: serverTimestamp(),
  });

  return downloadUrl;
}



