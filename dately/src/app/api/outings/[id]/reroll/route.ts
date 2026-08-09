import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { reroll } from "@/lib/outings";
import { REROLL_REASONS } from "@/lib/types";
import { handleError } from "@/lib/http";

const schema = z.object({ reason: z.enum(REROLL_REASONS) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("k");
    await requireOrganizer(id, token);
    const { reason } = schema.parse(await req.json());
    const outing = await reroll(id, reason);
    return NextResponse.json(outing);
  } catch (err) {
    return handleError(err);
  }
}
