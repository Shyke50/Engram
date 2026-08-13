import { describe, expect, it } from "vitest";
import {
  generatePlans,
  isEligible,
  pickPlan,
  reconcile,
  rerollOptionsFromReason,
} from "@/lib/matcher";
import type { CatalogItem, Submission } from "@/lib/types";

function item(overrides: Partial<CatalogItem> & { id: string }): CatalogItem {
  return {
    name: overrides.id,
    category: "food",
    neighborhood: "center_city",
    walkFromCenterMin: 5,
    costPerPerson: 20,
    durationMin: 60,
    vibeTags: ["chill"],
    tags: [],
    partySizeMin: 1,
    partySizeMax: 8,
    reservationNeeded: false,
    indoor: true,
    openHour: 8,
    closeHour: 23,
    curatorRating: 4,
    lat: 0,
    lng: 0,
    why: "because",
    ...overrides,
  };
}

function sub(overrides: Partial<Submission> = {}): Submission {
  return {
    budgetBand: "40to70",
    radius: "anywhere_philly",
    vibes: ["chill"],
    hardNos: [],
    mustHaves: [],
    ...overrides,
  };
}

const ctx = { timeWindow: "evening" as const };

describe("reconcile", () => {
  it("takes the most restrictive budget and radius across the group", () => {
    const r = reconcile([
      sub({ budgetBand: "70plus", radius: "anywhere_philly" }),
      sub({ budgetBand: "under20", radius: "centercity_walk" }),
    ]);
    expect(r.budgetCeiling).toBe(20);
    expect(r.maxWalk).toBe(15);
  });

  it("unions hard nos and must haves, and tallies vibe votes", () => {
    const r = reconcile([
      sub({ vibes: ["food"], hardNos: ["loud"], mustHaves: ["vegetarian"] }),
      sub({ vibes: ["food", "chill"], hardNos: ["spicy"] }),
    ]);
    expect(r.hardNos).toEqual(new Set(["loud", "spicy"]));
    expect(r.mustHaves).toEqual(new Set(["vegetarian"]));
    expect(r.vibeWeights.get("food")).toBe(2);
    expect(r.vibeWeights.get("chill")).toBe(1);
  });
});

describe("isEligible", () => {
  const r = reconcile([sub({ hardNos: ["loud"], mustHaves: ["vegetarian"] })]);

  it("rejects items carrying a hard-no tag", () => {
    expect(isEligible(item({ id: "a", tags: ["loud"] }), r, ctx)).toBe(false);
  });

  it("rejects items missing a must-have tag", () => {
    expect(isEligible(item({ id: "a", tags: [] }), r, ctx)).toBe(false);
    expect(isEligible(item({ id: "b", tags: ["vegetarian"] }), r, ctx)).toBe(true);
  });

  it("rejects items outside the walk radius", () => {
    const walkR = reconcile([sub({ radius: "centercity_walk" })]);
    expect(
      isEligible(item({ id: "far", walkFromCenterMin: 40 }), walkR, ctx),
    ).toBe(false);
  });

  it("respects party size bounds", () => {
    const big = { timeWindow: "evening" as const, partySize: 7 };
    expect(
      isEligible(item({ id: "small", partySizeMax: 4 }), r, big),
    ).toBe(false);
  });
});

describe("generatePlans", () => {
  const catalog = [
    item({ id: "dinner", category: "food", costPerPerson: 30, vibeTags: ["food"] }),
    item({ id: "bar", category: "drinks", costPerPerson: 20, openHour: 17, closeHour: 24, vibeTags: ["nightlife"] }),
    item({ id: "gelato", category: "dessert", costPerPerson: 8, vibeTags: ["chill"] }),
  ];

  it("returns no plans when there are no submissions", () => {
    expect(generatePlans(catalog, [], ctx)).toEqual([]);
  });

  it("assembles a multi-stop plan within budget", () => {
    const plan = pickPlan(catalog, [sub({ budgetBand: "70plus" })], ctx);
    expect(plan).not.toBeNull();
    expect(plan!.stops.length).toBeGreaterThanOrEqual(2);
    expect(plan!.costPerPerson).toBeLessThanOrEqual(70);
  });

  it("never exceeds the tightest budget in the group", () => {
    const plans = generatePlans(
      catalog,
      [sub({ budgetBand: "70plus" }), sub({ budgetBand: "under20" })],
      ctx,
    );
    for (const p of plans) expect(p.costPerPerson).toBeLessThanOrEqual(20);
  });

  it("is deterministic across repeated runs", () => {
    const a = generatePlans(catalog, [sub()], ctx);
    const b = generatePlans(catalog, [sub()], ctx);
    expect(a).toEqual(b);
  });

  it("schedules stops in order with no overlap", () => {
    const plan = pickPlan(catalog, [sub({ budgetBand: "70plus" })], ctx)!;
    for (let i = 1; i < plan.stops.length; i++) {
      const prev = plan.stops[i - 1];
      expect(plan.stops[i].startMinute).toBeGreaterThanOrEqual(
        prev.startMinute + prev.item.durationMin,
      );
    }
  });
});

describe("reroll", () => {
  const catalog = [
    item({ id: "pricey", category: "food", costPerPerson: 40 }),
    item({ id: "cheap", category: "food", costPerPerson: 12 }),
    item({ id: "bar", category: "drinks", costPerPerson: 15, openHour: 17, closeHour: 24 }),
    item({ id: "gelato", category: "dessert", costPerPerson: 8 }),
  ];

  it("excludes rejected items and lowers the ceiling on 'too expensive'", () => {
    const first = pickPlan(catalog, [sub({ budgetBand: "70plus" })], ctx)!;
    const opts = rerollOptionsFromReason("too_expensive", first);
    expect(opts.budgetOverride).toBeLessThan(first.costPerPerson);

    const second = pickPlan(catalog, [sub({ budgetBand: "70plus" })], ctx, opts);
    if (second) {
      expect(second.costPerPerson).toBeLessThanOrEqual(opts.budgetOverride!);
      const firstIds = first.stops.map((s) => s.item.id);
      const secondIds = second.stops.map((s) => s.item.id);
      expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
    }
  });

  it("'already_been' excludes exactly the rejected items", () => {
    const first = pickPlan(catalog, [sub()], ctx)!;
    const opts = rerollOptionsFromReason("already_been", first);
    for (const s of first.stops) {
      expect(opts.excludeItemIds).toContain(s.item.id);
    }
  });
});
