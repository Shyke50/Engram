import { NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/auth";
import { handleError } from "@/lib/http";

/** Organizer polling endpoint for the waiting room. Token via `?k=`. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("k");
    const outing = await requireOrganizer(id, token);
    return NextResponse.json(outing);
  } catch (err) {
    return handleError(err);
  }
}
