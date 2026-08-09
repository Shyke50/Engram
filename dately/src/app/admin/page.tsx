import { Card, Shell, Wordmark } from "@/components/ui";
import { getStore } from "@/lib/store";
import { isAdminAuthorized } from "@/lib/admin";
import { PHILLY_CATALOG } from "@/lib/catalog/philly";
import { AdminOverride } from "./AdminOverride";
import { baseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!isAdminAuthorized(token)) {
    return (
      <Shell>
        <Wordmark tag="Admin" />
        <Card>
          <p className="text-sm">
            Not authorized. Append <code>?token=YOUR_ADMIN_TOKEN</code> to the
            URL.
          </p>
        </Card>
      </Shell>
    );
  }

  const outings = await getStore().list(50);
  const base = baseUrl();

  return (
    <Shell>
      <Wordmark tag="Admin · curator console" />
      <p className="text-xs text-[var(--muted)]">
        {outings.length} recent outings. Override a plan by hand when the
        matcher&apos;s pick needs a human touch.
      </p>
      {outings.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">No outings yet.</p>
        </Card>
      ) : (
        outings.map((o) => (
          <Card key={o.id}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {o.partyType} · {o.day} · {o.timeWindow}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {o.accepted ? "accepted" : o.plan ? "planned" : "waiting"}
                {o.rerollUsed ? " · rerolled" : ""}
              </span>
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {o.submissions.length} responses ·{" "}
              {o.outcome ? (o.outcome.wentOut ? "went out ✓" : "didn't go") : "no outcome"}
            </div>
            {o.plan ? (
              <div className="mt-2 text-xs">
                {o.plan.stops.map((s) => s.item.name).join(" → ")}
              </div>
            ) : null}
            <div className="mt-2 flex gap-3 text-xs">
              <a className="text-[var(--brand)] underline" href={`${base}/o/${o.id}?k=${o.organizerToken}`}>
                console
              </a>
              <a className="text-[var(--brand)] underline" href={`${base}/card/${o.id}`}>
                card
              </a>
              <a className="text-[var(--brand)] underline" href={`${base}/j/${o.shareToken}`}>
                join
              </a>
            </div>
            {!o.accepted ? (
              <AdminOverride
                outingId={o.id}
                token={token ?? ""}
                catalog={PHILLY_CATALOG.map((i) => ({
                  id: i.id,
                  name: i.name,
                  category: i.category,
                  openHour: i.openHour,
                }))}
              />
            ) : null}
          </Card>
        ))
      )}
    </Shell>
  );
}
