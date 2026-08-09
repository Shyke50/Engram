/**
 * Admin gate. In production an ADMIN_TOKEN must be set and provided (via the
 * `admin_token` cookie or `?token=`); if it's unset in production, admin is
 * refused entirely. In development, admin is open for convenience.
 */
export function isAdminAuthorized(provided: string | null | undefined): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }
  return provided === expected;
}
