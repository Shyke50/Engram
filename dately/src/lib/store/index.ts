import { MemoryOutingStore } from "@/lib/store/memory";
import type { OutingStore } from "@/lib/store/types";

/**
 * Resolve the single process-wide store. Uses Postgres when DATABASE_URL is
 * set, otherwise the in-memory store. Cached on globalThis so dev hot-reloads
 * don't open a new connection pool (or a fresh empty map) on every edit.
 */
const globalForStore = globalThis as unknown as {
  __datelyStore?: OutingStore;
};

export function getStore(): OutingStore {
  if (globalForStore.__datelyStore) return globalForStore.__datelyStore;

  const url = process.env.DATABASE_URL;
  if (url) {
    // Lazy require so the pg driver is never loaded in the in-memory path.
    const { PostgresOutingStore } = require("@/lib/store/postgres") as typeof import("@/lib/store/postgres");
    globalForStore.__datelyStore = new PostgresOutingStore(url);
  } else {
    globalForStore.__datelyStore = new MemoryOutingStore();
  }
  return globalForStore.__datelyStore;
}

export type { OutingStore } from "@/lib/store/types";
