import { NextResponse } from "next/server";
import { OutingError } from "@/lib/outings";
import type { Outing } from "@/lib/types";

/**
 * Strip organizer-only secrets before sending an outing to a participant or a
 * public card. The organizer console re-attaches its token from the URL, so it
 * never needs the secret echoed back in the body.
 */
export function publicOuting(outing: Outing) {
  const { organizerToken: _organizerToken, ...rest } = outing;
  void _organizerToken;
  return rest;
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof OutingError) {
    const status = err.code === "not_found" ? 404 : 409;
    return NextResponse.json({ error: err.code, message: err.message }, { status });
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  return NextResponse.json({ error: "internal", message }, { status: 500 });
}
