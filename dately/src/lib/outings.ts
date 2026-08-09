/**
 * Outing service layer: the small set of state transitions the app supports,
 * each wiring together the store, the catalog and the pure matcher. API routes
 * call these; they contain the rules (e.g. "only one reroll") so those rules
 * live in one place rather than scattered across handlers.
 */
import { PHILLY_CATALOG } from "@/lib/catalog/philly";
import { newId, newToken } from "@/lib/ids";
import {
  pickPlan,
  rerollOptionsFromReason,
  type MatchContext,
} from "@/lib/matcher";
import { getStore } from "@/lib/store";
import type {
  Outcome,
  Outing,
  PartyType,
  Plan,
  RerollReason,
  Submission,
  TimeWindow,
} from "@/lib/types";

export interface CreateOutingInput {
  partyType: PartyType;
  day: string;
  timeWindow: TimeWindow;
}

export async function createOuting(input: CreateOutingInput): Promise<Outing> {
  const outing: Outing = {
    id: newId(),
    partyType: input.partyType,
    day: input.day,
    timeWindow: input.timeWindow,
    organizerToken: newToken(),
    shareToken: newToken(),
    submissions: [],
    plan: null,
    rerollUsed: false,
    rerollReason: null,
    accepted: false,
    outcome: null,
    createdAt: new Date().toISOString(),
  };
  return getStore().create(outing);
}

export async function addSubmission(
  shareToken: string,
  submission: Submission,
): Promise<Outing> {
  const store = getStore();
  const outing = await store.getByShareToken(shareToken);
  if (!outing) throw new OutingError("not_found", "Outing not found");
  if (outing.accepted) {
    throw new OutingError("locked", "This outing is already locked in");
  }
  return store.update(outing.id, {
    submissions: [...outing.submissions, submission],
  });
}

function matchContext(outing: Outing): MatchContext {
  return {
    timeWindow: outing.timeWindow,
    partySize:
      outing.partyType === "couple"
        ? 2
        : Math.max(outing.submissions.length, 3),
  };
}

/** Generate the first plan. No-op-safe: regenerates if not yet accepted. */
export async function generatePlan(id: string): Promise<Outing> {
  const store = getStore();
  const outing = await store.getById(id);
  if (!outing) throw new OutingError("not_found", "Outing not found");
  if (outing.submissions.length === 0) {
    throw new OutingError("no_submissions", "Nobody has submitted yet");
  }
  if (outing.accepted) {
    throw new OutingError("locked", "This outing is already locked in");
  }

  const plan = pickPlan(PHILLY_CATALOG, outing.submissions, matchContext(outing));
  if (!plan) {
    throw new OutingError(
      "no_plan",
      "No plan fits everyone's constraints — loosen something and retry",
    );
  }
  return store.update(id, { plan });
}

/** Spend the single group reroll. Requires a reason; the second plan is final. */
export async function reroll(id: string, reason: RerollReason): Promise<Outing> {
  const store = getStore();
  const outing = await store.getById(id);
  if (!outing) throw new OutingError("not_found", "Outing not found");
  if (!outing.plan) throw new OutingError("no_plan", "Nothing to reroll yet");
  if (outing.rerollUsed) {
    throw new OutingError("reroll_spent", "The group already used its one reroll");
  }
  if (outing.accepted) {
    throw new OutingError("locked", "This outing is already locked in");
  }

  const opts = rerollOptionsFromReason(reason, outing.plan);
  const next = pickPlan(PHILLY_CATALOG, outing.submissions, matchContext(outing), opts);
  // If nothing better fits the tightened constraints, keep the original plan
  // rather than leaving the group with nothing — but still burn the reroll.
  const plan: Plan = next ?? outing.plan;
  return store.update(id, { plan, rerollUsed: true, rerollReason: reason });
}

export async function acceptPlan(id: string): Promise<Outing> {
  const store = getStore();
  const outing = await store.getById(id);
  if (!outing) throw new OutingError("not_found", "Outing not found");
  if (!outing.plan) throw new OutingError("no_plan", "Nothing to accept yet");
  return store.update(id, { accepted: true });
}

export async function recordOutcome(id: string, outcome: Outcome): Promise<Outing> {
  const store = getStore();
  const outing = await store.getById(id);
  if (!outing) throw new OutingError("not_found", "Outing not found");
  return store.update(id, { outcome });
}

/** Admin: replace the plan by hand before it goes out. */
export async function overridePlan(id: string, plan: Plan): Promise<Outing> {
  return getStore().update(id, { plan });
}

export type OutingErrorCode =
  | "not_found"
  | "locked"
  | "no_submissions"
  | "no_plan"
  | "reroll_spent";

export class OutingError extends Error {
  constructor(
    public code: OutingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OutingError";
  }
}
