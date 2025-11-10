import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const requestSchema = z.object({
  orderId: z.string().min(1),
  designId: z.string().min(1),
  variantId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const payload = requestSchema.parse(await request.json());
    const firestore = getAdminFirestore();

    const orderRef = firestore.collection("orders").doc(payload.orderId);
    await orderRef.set(
      {
        generationStatus: "queued",
        generationQueuedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Stub: In production, queue a task (e.g., via Cloud Tasks, Vercel cron, or external worker)
    // to call CAD/3D APIs (Meshy, etc.) and persist resulting URLs under
    // orders/{orderId}.files.

    return NextResponse.json(
      {
        status: "queued",
        message: "3D generation task was queued.",
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: error.flatten() },
        { status: 422 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to queue generation task.";
    console.error("[generate-3d] error", message);
    return NextResponse.json(
      { error: "Unable to queue 3D generation.", detail: message },
      { status: 500 },
    );
  }
}



