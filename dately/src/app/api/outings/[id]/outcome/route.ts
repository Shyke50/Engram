import { NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/auth";
import { recordOutcome } from "@/lib/outings";
import { outcomeSchema } from "@/lib/types";
import { handleError } from "@/lib/http";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("k");
    await requireOrganizer(id, token);
    const outcome = outcomeSchema.parse(await req.json());
    const outing = await recordOutcome(id, outcome);
    return NextResponse.json(outing);
  } catch (err) {
    return handleError(err);
  }
}
