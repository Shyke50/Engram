import { randomBytes, randomUUID } from "node:crypto";

/** Stable primary id for an outing. */
export function newId(): string {
  return randomUUID();
}

/**
 * URL-safe opaque token. Used for both the organizer secret and the share
 * token. Length ~22 chars from 16 random bytes — unguessable enough that the
 * share link itself is the access control for the MVP.
 */
export function newToken(): string {
  return randomBytes(16).toString("base64url");
}
