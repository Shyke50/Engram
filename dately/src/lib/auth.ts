import { getStore } from "@/lib/store";
import { OutingError } from "@/lib/outings";
import type { Outing } from "@/lib/types";

/**
 * Gate organizer-only actions. The organizer token is the capability: whoever
 * holds it (from the create response, kept in the console URL) may generate,
 * reroll and accept. A timing-safe compare isn't warranted for the MVP's
 * random 128-bit tokens, but we still fetch-then-compare rather than querying
 * by token so the id in the URL is the primary key.
 */
export async function requireOrganizer(
  id: string,
  token: string | null,
): Promise<Outing> {
  const outing = await getStore().getById(id);
  if (!outing) throw new OutingError("not_found", "Outing not found");
  if (!token || token !== outing.organizerToken) {
    throw new OutingError("not_found", "Outing not found");
  }
  return outing;
}
