import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2024-06-20";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (client) {
    return client;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  client = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });

  return client;
}

export function getStripePublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.",
    );
  }
  return publishableKey;
}

