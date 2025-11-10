import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error(
    "STRIPE_WEBHOOK_SECRET is undefined. Configure the webhook signing secret.",
  );
}

const stripe = getStripeClient();

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const firestore = getAdminFirestore();
  const metadata = session.metadata ?? {};
  const designId = metadata.designId ?? null;
  const variantId = metadata.variantId ?? null;
  const ownerUid = metadata.ownerUid ?? null;

  const orderRef = firestore.collection("orders").doc(session.id);
  await orderRef.set(
    {
      status: "paid",
      paidAt: FieldValue.serverTimestamp(),
      stripeCustomerId: session.customer ?? null,
      stripePaymentIntentId: session.payment_intent ?? null,
      stripeCheckoutId: session.id,
      designId,
      variantId,
      ownerUid,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (designId && variantId) {
    const designRef = firestore.collection("designs").doc(designId);
    const variantRef = designRef.collection("variants").doc(variantId);

    await firestore.runTransaction(async (tx) => {
      tx.set(
        variantRef,
        {
          orderStatus: "paid",
          lastOrderAt: FieldValue.serverTimestamp(),
          stripeSessionId: session.id,
        },
        { merge: true },
      );

      tx.set(
        designRef,
        {
          lastOrderAt: FieldValue.serverTimestamp(),
          lastOrderStatus: "paid",
        },
        { merge: true },
      );
    });

    const requestUrl = new URL("/api/generate-3d", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    await fetch(requestUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Stripe-Order": session.id,
      },
      body: JSON.stringify({
        orderId: session.id,
        designId,
        variantId,
      }),
    }).catch((error) => {
      console.error("[stripe/webhooks] failed to trigger 3D generation", error);
    });
  }
}

async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  const firestore = getAdminFirestore();
  const orderRef = firestore.collection("orders").doc(session.id);

  await orderRef.set(
    {
      status: "failed",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    console.error("[stripe/webhooks] signature verification failed", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutFailed(session);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process webhook event";
    console.error("[stripe/webhooks] processing error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}



