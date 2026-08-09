/**
 * Thin analytics wrapper. The single number that matters is the share of
 * accepted plans where the group actually went out (`outing_went_out`), so the
 * event names below trace that funnel: created -> submitted -> generated ->
 * (rerolled) -> accepted -> went_out.
 *
 * When NEXT_PUBLIC_POSTHOG_KEY is unset, every call is a no-op, so instrumenting
 * code is always safe.
 */
export type AnalyticsEvent =
  | "outing_created"
  | "constraints_submitted"
  | "plan_generated"
  | "plan_rerolled"
  | "plan_accepted"
  | "plan_shared"
  | "outing_went_out";

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  if (typeof window === "undefined") return;

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  // Fire-and-forget capture; we intentionally don't block the UI on this.
  void fetch(`${host}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      event,
      properties: { ...props, $lib: "dately-web" },
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {
    // Analytics must never surface an error to the user.
  });
}
