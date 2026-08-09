/**
 * The Dately matcher — a pure function.
 *
 * Input: a catalog, the group's constraint submissions, and the outing context.
 * Output: a ranked list of fully-scheduled plans. No database, no framework, no
 * clock or randomness beyond an optional caller-supplied seed. This is the piece
 * we expect to tune the most, so it stays isolated and unit-testable against
 * fixture catalogs (see matcher.test.ts).
 *
 * Pipeline: reconcile submissions -> hard-filter items -> assemble candidate
 * plans from templates -> schedule against opening hours -> score -> rank.
 */

import {
  BUDGET_BANDS,
  type CatalogItem,
  type ConstraintTag,
  type ItemCategory,
  type Plan,
  type PlanStop,
  type Radius,
  type RerollReason,
  type Submission,
  type TimeWindow,
  type Vibe,
} from "@/lib/types";

const TRANSIT_MINUTES = 20;

const RADIUS_MAX_WALK: Record<Radius, number> = {
  centercity_walk: 15,
  transit_ok: 40,
  anywhere_philly: 9999,
};

const TIME_WINDOW_START: Record<TimeWindow, number> = {
  afternoon: 14 * 60,
  evening: 18 * 60,
  flexible: 17 * 60,
};

/** Rough target length per window, used only for a soft duration-fit score. */
const TIME_WINDOW_TARGET_MIN: Record<TimeWindow, number> = {
  afternoon: 180,
  evening: 210,
  flexible: 195,
};

/**
 * Plan shapes, each an ordered list of slots. A slot accepts any of its
 * categories, so `["outdoor", "culture"]` means "an activity of either kind".
 * Order matters: it's the sequence the group moves through.
 */
const TEMPLATES: ItemCategory[][][] = [
  [["food"], ["drinks"]],
  [["food"], ["dessert"]],
  [["outdoor", "culture"], ["food"]],
  [["culture"], ["food"], ["drinks"]],
  [["outdoor"], ["food"], ["dessert"]],
  [["food"], ["outdoor", "culture"], ["dessert"]],
];

export interface Reconciled {
  budgetCeiling: number;
  maxWalk: number;
  hardNos: Set<ConstraintTag>;
  mustHaves: Set<ConstraintTag>;
  vibeWeights: Map<Vibe, number>;
  partySize: number;
}

export interface MatchContext {
  timeWindow: TimeWindow;
  partySize?: number;
}

export interface MatchOptions {
  /** Item ids to exclude entirely (rerolled-away or "already been"). */
  excludeItemIds?: string[];
  /** Hard budget ceiling override (per person), e.g. after "too expensive". */
  budgetOverride?: number;
  /** Tighter walk radius override, e.g. after "too far". */
  maxWalkOverride?: number;
  /** Vibes to down-weight, e.g. after "wrong vibe". */
  dampenVibes?: Vibe[];
}

/** Collapse many individual submissions into one group constraint set. */
export function reconcile(submissions: Submission[]): Reconciled {
  const budgetCeiling = Math.min(
    ...submissions.map((s) => BUDGET_BANDS[s.budgetBand]),
  );
  const maxWalk = Math.min(
    ...submissions.map((s) => RADIUS_MAX_WALK[s.radius]),
  );
  const hardNos = new Set<ConstraintTag>();
  const mustHaves = new Set<ConstraintTag>();
  const vibeWeights = new Map<Vibe, number>();

  for (const s of submissions) {
    for (const t of s.hardNos) hardNos.add(t);
    for (const t of s.mustHaves) mustHaves.add(t);
    for (const v of s.vibes) {
      vibeWeights.set(v, (vibeWeights.get(v) ?? 0) + 1);
    }
  }

  return {
    budgetCeiling,
    maxWalk,
    hardNos,
    mustHaves,
    vibeWeights,
    partySize: submissions.length,
  };
}

/**
 * Hard filter: an item is eligible only if it violates nothing strict. These
 * are the constraints we never trade off — budget ceiling is applied later at
 * the plan level since it's a sum.
 */
export function isEligible(
  item: CatalogItem,
  r: Reconciled,
  ctx: MatchContext,
  opts: MatchOptions = {},
): boolean {
  if (opts.excludeItemIds?.includes(item.id)) return false;

  const maxWalk = opts.maxWalkOverride ?? r.maxWalk;
  if (item.walkFromCenterMin > maxWalk) return false;

  for (const no of r.hardNos) {
    if (item.tags.includes(no)) return false;
  }
  for (const must of r.mustHaves) {
    if (!item.tags.includes(must)) return false;
  }

  const party = ctx.partySize ?? r.partySize;
  if (party < item.partySizeMin || party > item.partySizeMax) return false;

  return true;
}

function itemVibeScore(item: CatalogItem, r: Reconciled, dampen: Set<Vibe>): number {
  let score = 0;
  for (const v of item.vibeTags) {
    const weight = r.vibeWeights.get(v) ?? 0;
    score += dampen.has(v) ? weight * 0.2 : weight;
  }
  return score;
}

function fits(item: CatalogItem, startMinute: number): boolean {
  const open = item.openHour * 60;
  const close = item.closeHour * 60;
  return startMinute >= open && startMinute + item.durationMin <= close;
}

/** Place an ordered set of items into a schedule, or return null if any fails. */
function schedule(
  items: CatalogItem[],
  ctx: MatchContext,
): PlanStop[] | null {
  let cursor = TIME_WINDOW_START[ctx.timeWindow];
  const stops: PlanStop[] = [];
  for (const item of items) {
    if (!fits(item, cursor)) return null;
    stops.push({ item, startMinute: cursor, why: item.why });
    cursor += item.durationMin + TRANSIT_MINUTES;
  }
  return stops;
}

interface ScoredPlan {
  plan: Plan;
  score: number;
  signature: string;
}

function buildPlan(
  items: CatalogItem[],
  r: Reconciled,
  ctx: MatchContext,
  opts: MatchOptions,
): ScoredPlan | null {
  const budget = opts.budgetOverride ?? r.budgetCeiling;
  const cost = items.reduce((sum, it) => sum + it.costPerPerson, 0);
  if (cost > budget) return null;

  const stops = schedule(items, ctx);
  if (!stops) return null;

  const dampen = new Set(opts.dampenVibes ?? []);
  const totalDurationMin =
    items.reduce((sum, it) => sum + it.durationMin, 0) +
    TRANSIT_MINUTES * (items.length - 1);

  const vibeScore = items.reduce(
    (sum, it) => sum + itemVibeScore(it, r, dampen),
    0,
  );
  const ratingScore =
    items.reduce((sum, it) => sum + it.curatorRating, 0) / items.length;
  const target = TIME_WINDOW_TARGET_MIN[ctx.timeWindow];
  const durationPenalty = Math.abs(totalDurationMin - target) / 60;
  const headroom = budget === Infinity ? 0 : (budget - cost) / budget;
  const reservationPenalty = items.filter((it) => it.reservationNeeded).length * 0.15;

  const score =
    vibeScore * 1.0 +
    ratingScore * 0.6 +
    headroom * 0.4 -
    durationPenalty * 0.5 -
    reservationPenalty;

  const rationale = buildRationale(items, r, cost);

  return {
    plan: { stops, costPerPerson: cost, totalDurationMin, rationale },
    score,
    signature: items.map((it) => it.id).sort().join("+"),
  };
}

function buildRationale(items: CatalogItem[], r: Reconciled, cost: number): string {
  const topVibe = [...r.vibeWeights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const costLabel = cost === 0 ? "free" : `about $${cost}/person`;
  const vibeLabel = topVibe ? `leans ${topVibe}` : "balanced";
  return `${items.length} stops, ${costLabel}, ${vibeLabel} — within everyone's limits.`;
}

/**
 * Generate ranked plans. Deterministic: equal-scoring plans are ordered by
 * signature so output is stable across runs (important for tests and reroll).
 */
export function generatePlans(
  catalog: CatalogItem[],
  submissions: Submission[],
  ctx: MatchContext,
  opts: MatchOptions = {},
): Plan[] {
  if (submissions.length === 0) return [];
  const r = reconcile(submissions);
  const eligible = catalog.filter((it) => isEligible(it, r, ctx, opts));

  const byCategory = new Map<ItemCategory, CatalogItem[]>();
  for (const it of eligible) {
    const list = byCategory.get(it.category) ?? [];
    list.push(it);
    byCategory.set(it.category, list);
  }

  const scored: ScoredPlan[] = [];
  const seenSignatures = new Set<string>();

  for (const template of TEMPLATES) {
    const slotOptions = template.map((categories) =>
      categories.flatMap((c) => byCategory.get(c) ?? []),
    );
    if (slotOptions.some((opts2) => opts2.length === 0)) continue;

    for (const combo of cartesian(slotOptions)) {
      if (hasDuplicate(combo)) continue;
      const built = buildPlan(combo, r, ctx, opts);
      if (!built) continue;
      if (seenSignatures.has(built.signature)) continue;
      seenSignatures.add(built.signature);
      scored.push(built);
    }
  }

  scored.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : a.signature.localeCompare(b.signature),
  );
  return scored.map((s) => s.plan);
}

/** The MVP promise: exactly one plan (or null if nothing fits). */
export function pickPlan(
  catalog: CatalogItem[],
  submissions: Submission[],
  ctx: MatchContext,
  opts: MatchOptions = {},
): Plan | null {
  return generatePlans(catalog, submissions, ctx, opts)[0] ?? null;
}

/**
 * Translate a reroll reason into concrete new constraints, given the plan the
 * group rejected. Keeps the "reroll must improve, not just differ" rule.
 */
export function rerollOptionsFromReason(
  reason: RerollReason,
  rejected: Plan,
  base: MatchOptions = {},
): MatchOptions {
  const rejectedIds = rejected.stops.map((s) => s.item.id);
  const opts: MatchOptions = {
    ...base,
    excludeItemIds: [...(base.excludeItemIds ?? []), ...rejectedIds],
  };

  switch (reason) {
    case "too_expensive":
      opts.budgetOverride = Math.max(
        0,
        Math.floor(rejected.costPerPerson * 0.75),
      );
      break;
    case "too_far": {
      const maxWalk = Math.max(
        ...rejected.stops.map((s) => s.item.walkFromCenterMin),
      );
      opts.maxWalkOverride = Math.max(10, Math.floor(maxWalk * 0.6));
      break;
    }
    case "wrong_vibe": {
      const vibeCounts = new Map<Vibe, number>();
      for (const s of rejected.stops) {
        for (const v of s.item.vibeTags) {
          vibeCounts.set(v, (vibeCounts.get(v) ?? 0) + 1);
        }
      }
      const dominant = [...vibeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      opts.dampenVibes = dominant ? [dominant] : [];
      break;
    }
    case "already_been":
      // Excluding the rejected items (done above) is the whole fix here.
      break;
    case "bad_timing":
      // Re-running with the rejected items excluded surfaces a different mix;
      // scheduling constraints are already enforced in buildPlan.
      break;
  }

  return opts;
}

function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])),
    [[]],
  );
}

function hasDuplicate(items: CatalogItem[]): boolean {
  return new Set(items.map((i) => i.id)).size !== items.length;
}
