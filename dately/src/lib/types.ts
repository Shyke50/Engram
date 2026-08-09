/**
 * Core domain model for Dately.
 *
 * These types are the shared vocabulary between the catalog, the matcher and
 * the UI. The matcher (see `matcher.ts`) is a pure function over `CatalogItem[]`
 * plus `Submission[]`, so everything it needs lives here with no I/O.
 */

import { z } from "zod";

/** Budget ceilings, per person, in USD. `flexible` imposes no ceiling. */
export const BUDGET_BANDS = {
  under20: 20,
  "20to40": 40,
  "40to70": 70,
  "70plus": 1000,
  flexible: Infinity,
} as const;

export type BudgetBand = keyof typeof BUDGET_BANDS;

/** How far a participant will travel. Ordered from most to least restrictive. */
export const RADIUS_OPTIONS = [
  "centercity_walk",
  "transit_ok",
  "anywhere_philly",
] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export const VIBES = [
  "chill",
  "active",
  "food",
  "artsy",
  "nightlife",
  "celebrate",
] as const;
export type Vibe = (typeof VIBES)[number];

/**
 * Hard nos and must-haves share a tag vocabulary with catalog items so the
 * matcher can compare them directly. A hard no excludes any item carrying the
 * tag; a must-have requires it.
 */
export const CONSTRAINT_TAGS = [
  "loud",
  "long_walk",
  "spicy",
  "museum",
  "outdoor_cold",
  "bar_heavy",
  "vegetarian",
  "vegan",
  "dog_friendly",
  "wheelchair",
  "photo_friendly",
  "quiet_talk",
] as const;
export type ConstraintTag = (typeof CONSTRAINT_TAGS)[number];

export const PARTY_TYPES = ["couple", "group"] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export const TIME_WINDOWS = ["afternoon", "evening", "flexible"] as const;
export type TimeWindow = (typeof TIME_WINDOWS)[number];

export type Neighborhood =
  | "center_city"
  | "old_city"
  | "fishtown"
  | "south_philly"
  | "university_city"
  | "northern_liberties"
  | "rittenhouse"
  | "fairmount";

export type ItemCategory =
  | "food"
  | "drinks"
  | "activity"
  | "dessert"
  | "outdoor"
  | "culture";

/**
 * A single curated venue or activity. This is the unit curators author (in a
 * spreadsheet, synced to `src/lib/catalog`). Plans are assembled from these.
 */
export interface CatalogItem {
  id: string;
  name: string;
  category: ItemCategory;
  neighborhood: Neighborhood;
  /** Walking distance in minutes from City Hall, used for the radius filter. */
  walkFromCenterMin: number;
  /** Typical spend per person at this stop, in USD. */
  costPerPerson: number;
  /** How long groups usually spend here, in minutes. */
  durationMin: number;
  /** Vibes this item leans into. Drives the score, not the hard filter. */
  vibeTags: Vibe[];
  /** Tags from CONSTRAINT_TAGS this item carries (e.g. `loud`, `vegetarian`). */
  tags: ConstraintTag[];
  partySizeMin: number;
  partySizeMax: number;
  reservationNeeded: boolean;
  indoor: boolean;
  /** Hours as [openHour, closeHour) in 24h local time, per the MVP. */
  openHour: number;
  closeHour: number;
  /** 0-5, hand-set by a curator. Breaks ties between otherwise equal items. */
  curatorRating: number;
  lat: number;
  lng: number;
  /** One-liner the reveal screen shows as the "why this fits" note. */
  why: string;
}

/** One participant's answers to the constraints form. */
export const submissionSchema = z.object({
  name: z.string().trim().max(60).optional(),
  budgetBand: z.enum(
    Object.keys(BUDGET_BANDS) as [BudgetBand, ...BudgetBand[]],
  ),
  radius: z.enum(RADIUS_OPTIONS),
  vibes: z.array(z.enum(VIBES)).min(1),
  hardNos: z.array(z.enum(CONSTRAINT_TAGS)).default([]),
  mustHaves: z.array(z.enum(CONSTRAINT_TAGS)).default([]),
});
export type Submission = z.infer<typeof submissionSchema>;

/** A stop in a generated plan: a catalog item placed at a start time. */
export interface PlanStop {
  item: CatalogItem;
  /** Minutes past midnight local time when this stop starts. */
  startMinute: number;
  why: string;
}

export interface Plan {
  stops: PlanStop[];
  costPerPerson: number;
  totalDurationMin: number;
  /** Human-readable summary of how this plan satisfied the group. */
  rationale: string;
}

export const REROLL_REASONS = [
  "too_expensive",
  "too_far",
  "wrong_vibe",
  "bad_timing",
  "already_been",
] as const;
export type RerollReason = (typeof REROLL_REASONS)[number];

export const outcomeSchema = z.object({
  wentOut: z.boolean(),
  thumbsUp: z.boolean().optional(),
});
export type Outcome = z.infer<typeof outcomeSchema>;

export interface Outing {
  id: string;
  partyType: PartyType;
  /** ISO date (YYYY-MM-DD) of the outing. */
  day: string;
  timeWindow: TimeWindow;
  /** Secret held by the organizer; grants generate/accept/reroll rights. */
  organizerToken: string;
  /** Shared in the group chat; grants submit rights only. */
  shareToken: string;
  submissions: Submission[];
  plan: Plan | null;
  rerollUsed: boolean;
  rerollReason: RerollReason | null;
  accepted: boolean;
  outcome: Outcome | null;
  createdAt: string;
}
