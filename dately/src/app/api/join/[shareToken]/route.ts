import { NextResponse } from "next/server";
import { addSubmission } from "@/lib/outings";
import { submissionSchema } from "@/lib/types";
import { handleError, publicOuting } from "@/lib/http";
import { getStore } from "@/lib/store";

/** Participant view of an outing, looked up by the share token. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const { shareToken } = await params;
    const outing = await getStore().getByShareToken(shareToken);
    if (!outing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(publicOuting(outing));
  } catch (err) {
    return handleError(err);
  }
}

/** Submit one participant's constraints. No account required. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const { shareToken } = await params;
    const submission = submissionSchema.parse(await req.json());
    const outing = await addSubmission(shareToken, submission);
    return NextResponse.json(publicOuting(outing), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
