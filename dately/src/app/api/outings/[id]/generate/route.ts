import { NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/auth";
import { generatePlan } from "@/lib/outings";
import { handleError } from "@/lib/http";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("k");
    await requireOrganizer(id, token);
    const outing = await generatePlan(id);
    return NextResponse.json(outing);
  } catch (err) {
    return handleError(err);
  }
}
