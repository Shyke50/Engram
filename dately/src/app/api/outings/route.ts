import { NextResponse } from "next/server";
import { z } from "zod";
import { PARTY_TYPES, TIME_WINDOWS } from "@/lib/types";
import { createOuting } from "@/lib/outings";
import { handleError } from "@/lib/http";

const createSchema = z.object({
  partyType: z.enum(PARTY_TYPES),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  timeWindow: z.enum(TIME_WINDOWS),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createSchema.parse(body);
    const outing = await createOuting(input);
    // The organizer needs both tokens here; this response is only ever seen by
    // the creating client, which immediately navigates to the console.
    return NextResponse.json(
      {
        id: outing.id,
        organizerToken: outing.organizerToken,
        shareToken: outing.shareToken,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
