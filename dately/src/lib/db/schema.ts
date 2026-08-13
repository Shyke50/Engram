/**
 * Drizzle schema for the persistent store.
 *
 * Only outing *state* lives in the database. The curated catalog is versioned
 * in the repo (src/lib/catalog) and synced from a spreadsheet — see
 * docs/CURATION.md — so it is intentionally not a table here.
 */
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Outcome, Plan, Submission } from "@/lib/types";

export const outings = pgTable("outings", {
  id: text("id").primaryKey(),
  partyType: text("party_type").notNull(),
  day: text("day").notNull(),
  timeWindow: text("time_window").notNull(),
  organizerToken: text("organizer_token").notNull(),
  shareToken: text("share_token").notNull(),
  submissions: jsonb("submissions").$type<Submission[]>().notNull().default([]),
  plan: jsonb("plan").$type<Plan | null>(),
  rerollUsed: boolean("reroll_used").notNull().default(false),
  rerollReason: text("reroll_reason"),
  accepted: boolean("accepted").notNull().default(false),
  outcome: jsonb("outcome").$type<Outcome | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
