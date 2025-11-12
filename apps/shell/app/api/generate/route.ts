import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateAll } from "@repo/generation-engine";
import { LAYOUT_IDS, canonicalLayoutId, type LayoutId } from "@/domain/spec";

export const runtime = "nodejs";

const layoutEnum = z.enum(LAYOUT_IDS as [LayoutId, ...LayoutId[]]).or(z.string());

const requestSchema = z.object({
  layouts: z.array(layoutEnum).min(1).max(4).optional(),
  perLayout: z.number().int().min(1).max(4).optional(),
  budget: z.number().int().positive().optional().nullable(),
  baseDoor: z.string().optional(),
  baseTop: z.string().optional(),
  useLLM: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request payload.",
          issues: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const { layouts, perLayout, budget, baseDoor, baseTop, useLLM } = parsed.data;

    let normalizedLayouts: string[] | undefined;
    try {
      normalizedLayouts = layouts
        ? layouts.map((layout) => canonicalLayoutId(layout))
        : undefined;
    } catch (layoutError) {
      const message =
        layoutError instanceof Error ? layoutError.message : "Unsupported layout id.";
      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        { status: 422 },
      );
    }

    const llm = Boolean(useLLM && process.env.GEMINI_API_KEY);

    const result = await generateAll({
      layouts: normalizedLayouts,
      perLayout,
      budget: budget ?? null,
      baseDoor,
      baseTop,
      useLLM: llm,
    });

    return NextResponse.json({
      ok: true,
      run_id: result.run_id,
      results: result.results,
      useLLM: llm,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to generate variants.",
        detail: message,
      },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    note: "POST to this endpoint with layouts, perLayout (1-4), optional budget, and base finishes to generate deterministic variants.",
  });
}


