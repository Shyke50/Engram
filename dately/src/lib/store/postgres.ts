import { desc, eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Outing, RerollReason } from "@/lib/types";
import { outings } from "@/lib/db/schema";
import type { OutingStore } from "@/lib/store/types";

type Row = typeof outings.$inferSelect;

function rowToOuting(row: Row): Outing {
  return {
    id: row.id,
    partyType: row.partyType as Outing["partyType"],
    day: row.day,
    timeWindow: row.timeWindow as Outing["timeWindow"],
    organizerToken: row.organizerToken,
    shareToken: row.shareToken,
    submissions: row.submissions,
    plan: row.plan,
    rerollUsed: row.rerollUsed,
    rerollReason: (row.rerollReason as RerollReason | null) ?? null,
    accepted: row.accepted,
    outcome: row.outcome,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export class PostgresOutingStore implements OutingStore {
  private db: PostgresJsDatabase;

  constructor(connectionString: string) {
    const client = postgres(connectionString, { max: 5 });
    this.db = drizzle(client);
  }

  async create(outing: Outing): Promise<Outing> {
    await this.db.insert(outings).values({
      id: outing.id,
      partyType: outing.partyType,
      day: outing.day,
      timeWindow: outing.timeWindow,
      organizerToken: outing.organizerToken,
      shareToken: outing.shareToken,
      submissions: outing.submissions,
      plan: outing.plan,
      rerollUsed: outing.rerollUsed,
      rerollReason: outing.rerollReason,
      accepted: outing.accepted,
      outcome: outing.outcome,
      createdAt: new Date(outing.createdAt),
    });
    return outing;
  }

  async getById(id: string): Promise<Outing | null> {
    const rows = await this.db.select().from(outings).where(eq(outings.id, id)).limit(1);
    return rows[0] ? rowToOuting(rows[0]) : null;
  }

  async getByShareToken(token: string): Promise<Outing | null> {
    const rows = await this.db
      .select()
      .from(outings)
      .where(eq(outings.shareToken, token))
      .limit(1);
    return rows[0] ? rowToOuting(rows[0]) : null;
  }

  async update(id: string, patch: Partial<Outing>): Promise<Outing> {
    const set: Partial<Row> = {};
    if (patch.submissions !== undefined) set.submissions = patch.submissions;
    if (patch.plan !== undefined) set.plan = patch.plan;
    if (patch.rerollUsed !== undefined) set.rerollUsed = patch.rerollUsed;
    if (patch.rerollReason !== undefined) set.rerollReason = patch.rerollReason;
    if (patch.accepted !== undefined) set.accepted = patch.accepted;
    if (patch.outcome !== undefined) set.outcome = patch.outcome;

    const rows = await this.db
      .update(outings)
      .set(set)
      .where(eq(outings.id, id))
      .returning();
    if (!rows[0]) throw new Error(`Outing ${id} not found`);
    return rowToOuting(rows[0]);
  }

  async list(limit = 50): Promise<Outing[]> {
    const rows = await this.db
      .select()
      .from(outings)
      .orderBy(desc(outings.createdAt))
      .limit(limit);
    return rows.map(rowToOuting);
  }
}
