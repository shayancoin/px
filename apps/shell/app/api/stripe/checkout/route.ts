import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getStripeClient } from "@/lib/stripe";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 15;
export const preferredRegion = ["iad1"];

const requestSchema = z.object({
  designId: z.string().trim().min(1),
  variantId: z.string().trim().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header." },
        { status: 401 },
      );
    }

    const idToken = authHeader.substring("Bearer ".length).trim();
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const ownerUid = decoded.uid;

    const payload = requestSchema.parse(await request.json());
    const { designId, variantId } = payload;

    const firestore = getAdminFirestore();
    const designRef = firestore.collection("designs").doc(designId);
    const variantRef = designRef.collection("variants").doc(variantId);

    const variantSnap = await variantRef.get();
    if (!variantSnap.exists) {
      return NextResponse.json(
        { error: "Variant not found for checkout." },
        { status: 404 },
      );
    }

    const variant = variantSnap.data();
    if (!variant) {
      return NextResponse.json(
        { error: "Variant data unavailable." },
        { status: 500 },
      );
    }

    if (variant.ownerUid && variant.ownerUid !== ownerUid) {
      return NextResponse.json(
        { error: "You are not authorised to checkout this variant." },
        { status: 403 },
      );
    }

    const depositUSD: number | undefined = variant.pricing?.depositUSD;
    const totalUSD: number | undefined = variant.pricing?.totalUSD;

    if (!depositUSD || depositUSD <= 0) {
      return NextResponse.json(
        { error: "Variant pricing missing or invalid deposit amount." },
        { status: 400 },
      );
    }

    const amountCents = Math.round(depositUSD * 100);
    const baseUrl =
      payload.successUrl?.split("/").slice(0, 3).join("/") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const successUrl =
      payload.successUrl ??
      `${baseUrl}/dashboard?designId=${designId}&checkout=success`;
    const cancelUrl =
      payload.cancelUrl ??
      `${baseUrl}/configurator?designId=${designId}&checkout=cancelled`;

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe integration not configured." },
        { status: 503 },
      );
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "en",
      customer_email: decoded.email ?? undefined,
      metadata: {
        designId,
        variantId,
        ownerUid,
        totalUSD: totalUSD?.toString() ?? "",
        depositUSD: depositUSD.toString(),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Kitchen deposit • ${variant.layoutName ?? "Custom"}`,
              description: `Design ${variant.layoutId ?? ""} · Variant ${variant.variantIndex ?? ""} (20% deposit)`,
            },
          },
        },
      ],
    });

    await firestore.collection("orders").doc(session.id).set({
      status: "pending",
      designId,
      variantId,
      ownerUid,
      stripeSessionId: session.id,
      stripeIntentId: session.payment_intent ?? null,
      amountUSD: depositUSD,
      currency: "USD",
      totals: {
        depositUSD,
        totalUSD: totalUSD ?? null,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: error.flatten() },
        { status: 422 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    console.error("[stripe/checkout] error", message);
    return NextResponse.json(
      { error: "Failed to create Stripe Checkout session.", detail: message },
      { status: 500 },
    );
  }
}



