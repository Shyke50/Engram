import type { Outing } from "@/lib/types";
import type { OutingStore } from "@/lib/store/types";

/**
 * In-memory store. Default when no DATABASE_URL is configured. State is lost on
 * restart, which is fine for local development and clicking through the flow.
 *
 * The map is stashed on globalThis so it survives Next.js dev hot-reloads,
 * which otherwise re-evaluate modules and would wipe state on every edit.
 */
const globalForStore = globalThis as unknown as {
  __datelyOutings?: Map<string, Outing>;
};

const outings = globalForStore.__datelyOutings ?? new Map<string, Outing>();
globalForStore.__datelyOutings = outings;

export class MemoryOutingStore implements OutingStore {
  async create(outing: Outing): Promise<Outing> {
    outings.set(outing.id, outing);
    return outing;
  }

  async getById(id: string): Promise<Outing | null> {
    return outings.get(id) ?? null;
  }

  async getByShareToken(token: string): Promise<Outing | null> {
    for (const o of outings.values()) {
      if (o.shareToken === token) return o;
    }
    return null;
  }

  async update(id: string, patch: Partial<Outing>): Promise<Outing> {
    const existing = outings.get(id);
    if (!existing) throw new Error(`Outing ${id} not found`);
    const updated = { ...existing, ...patch, id };
    outings.set(id, updated);
    return updated;
  }

  async list(limit = 50): Promise<Outing[]> {
    return [...outings.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}
