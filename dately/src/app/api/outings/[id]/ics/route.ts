import { getStore } from "@/lib/store";
import { buildIcs } from "@/lib/ics";
import { baseUrl } from "@/lib/env";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const outing = await getStore().getById(id);
  if (!outing || !outing.plan) {
    return new Response("Not found", { status: 404 });
  }
  const ics = buildIcs(outing, baseUrl());
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="dately-${id}.ics"`,
    },
  });
}
