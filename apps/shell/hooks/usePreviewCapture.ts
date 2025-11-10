"use client";

import { useCallback, useState } from "react";
import type { Stage } from "konva/lib/Stage";
import { saveVariantPreview } from "@/lib/preview";

type CaptureArgs = {
  stage: Stage;
  designId: string;
  variantId: string;
  ownerUid: string;
};

export function usePreviewCapture() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const capture = useCallback(
    async ({ stage, designId, variantId, ownerUid }: CaptureArgs) => {
      setLoading(true);
      setError(null);
      try {
        const url = await saveVariantPreview({
          stage,
          designId,
          variantId,
          ownerUid,
        });
        setPreviewUrl(url);
        return url;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to export preview image.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    capture,
    loading,
    error,
    previewUrl,
    resetError: () => setError(null),
  };
}



