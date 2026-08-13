import type {
  BudgetBand,
  Radius,
  RerollReason,
  TimeWindow,
  Vibe,
} from "@/lib/types";

/** Minutes past midnight -> "6:30 PM". */
export function formatTime(minute: number): string {
  const h24 = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatCost(cost: number): string {
  return cost === 0 ? "Free" : `$${cost}`;
}

export const BUDGET_LABELS: Record<BudgetBand, string> = {
  under20: "Under $20",
  "20to40": "$20–40",
  "40to70": "$40–70",
  "70plus": "$70+",
  flexible: "Surprise me",
};

export const RADIUS_LABELS: Record<Radius, string> = {
  centercity_walk: "Walk from Center City",
  transit_ok: "SEPTA / Uber is fine",
  anywhere_philly: "Anywhere in Philly",
};

export const VIBE_LABELS: Record<Vibe, string> = {
  chill: "Chill",
  active: "Active",
  food: "Food-focused",
  artsy: "Artsy",
  nightlife: "Nightlife",
  celebrate: "Celebrate",
};

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  afternoon: "Afternoon",
  evening: "Evening",
  flexible: "Flexible",
};

export const REROLL_REASON_LABELS: Record<RerollReason, string> = {
  too_expensive: "Too expensive",
  too_far: "Too far",
  wrong_vibe: "Wrong vibe",
  bad_timing: "Bad timing",
  already_been: "Already been there",
};
