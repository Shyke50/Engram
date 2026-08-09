import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin";
import { PHILLY_CATALOG } from "@/lib/catalog/philly";
import { getStore } from "@/lib/store";
import { overridePlan } from "@/lib/outings";
import { handleError } from "@/lib/http";
import type { Plan, PlanStop } from "@/lib/types";

/**
 * Admin override: hand-build a plan from an ordered list of catalog item ids
 * and start times. This is the "human in the loop" escape hatch — a slower,
 * verified plan beats a fast mediocre one while the catalog is small.
 */
const schema = z.object({
  stops: z
    .array(z.object({ itemId: z.string(), startMinute: z.number().int() }))
    .min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token =
      req.headers.get("x-admin-token") ??
      new URL(req.url).searchParams.get("token");
    if (!isAdminAuthorized(token)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const outing = await getStore().getById(id);
    if (!outing) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { stops } = schema.parse(await req.json());
    const planStops: PlanStop[] = stops.map((s) => {
      const item = PHILLY_CATALOG.find((i) => i.id === s.itemId);
      if (!item) throw new Error(`Unknown catalog item: ${s.itemId}`);
      return { item, startMinute: s.startMinute, why: item.why };
    });

    const plan: Plan = {
      stops: planStops,
      costPerPerson: planStops.reduce((sum, s) => sum + s.item.costPerPerson, 0),
      totalDurationMin: planStops.reduce((sum, s) => sum + s.item.durationMin, 0),
      rationale: "Hand-picked by a Dately curator.",
    };

    const updated = await overridePlan(id, plan);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}
