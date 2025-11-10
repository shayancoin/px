"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { getStripeJs } from "@/lib/stripe-browser";

type CheckoutArgs = {
  designId: string;
  variantId: string;
  successUrl?: string;
  cancelUrl?: string;
};

export function useStripeCheckout() {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = useCallback(
    async ({ designId, variantId, successUrl, cancelUrl }: CheckoutArgs) => {
      setLoading(true);
      setError(null);

      try {
        const idToken = await getIdToken();
        if (!idToken) {
          throw new Error("User must be authenticated to initiate checkout.");
        }

        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            designId,
            variantId,
            successUrl,
            cancelUrl,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "Checkout session creation failed.");
        }

        const {
          sessionId,
          checkoutUrl,
        }: { sessionId?: string; checkoutUrl?: string } =
          await response.json();

        const stripe = await getStripeJs();
        if (stripe && sessionId) {
          const result = await stripe.redirectToCheckout({ sessionId });
          if (result.error) {
            throw result.error;
          }
        } else if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          throw new Error("Stripe is unavailable in this environment.");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown checkout error.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getIdToken],
  );

  return {
    initiateCheckout,
    loading,
    error,
    resetError: () => setError(null),
  };
}



