import type { Outing } from "@/lib/types";

/**
 * Persistence contract for outing state. Two implementations exist: an
 * in-memory store (default, zero-config, non-durable) and a Postgres store
 * (used when DATABASE_URL is set). The rest of the app only sees this interface.
 */
export interface OutingStore {
  create(outing: Outing): Promise<Outing>;
  getById(id: string): Promise<Outing | null>;
  /** Look up by the participant-facing share token. */
  getByShareToken(token: string): Promise<Outing | null>;
  update(id: string, patch: Partial<Outing>): Promise<Outing>;
  /** Recent outings, newest first — used by the admin view. */
  list(limit?: number): Promise<Outing[]>;
}
