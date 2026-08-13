import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, Shell, Wordmark } from "@/components/ui";
import { PlanView } from "@/components/PlanView";
import { getStore } from "@/lib/store";
import { staticMapUrl } from "@/lib/map";
import { TIME_WINDOW_LABELS } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const outing = await getStore().getById(id);
  if (!outing?.plan) return { title: "Dately" };
  const stops = outing.plan.stops.map((s) => s.item.name).join(" → ");
  return {
    title: `Dately plan: ${stops}`,
    description: `${TIME_WINDOW_LABELS[outing.timeWindow]} in Philly · ${outing.plan.rationale}`,
    openGraph: {
      title: `Our Dately plan: ${stops}`,
      description: outing.plan.rationale,
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outing = await getStore().getById(id);
  if (!outing) notFound();
  if (!outing.plan) {
    return (
      <Shell>
        <Wordmark />
        <Card>
          <p className="text-sm text-[var(--muted)]">
            This outing doesn&apos;t have a plan yet.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Wordmark tag={`${TIME_WINDOW_LABELS[outing.timeWindow]} in Philly`} />
      {outing.accepted ? (
        <div className="rounded-xl bg-[var(--brand)] px-4 py-2 text-center text-sm font-semibold text-white">
          Locked in — see you there
        </div>
      ) : null}
      <PlanView plan={outing.plan} mapUrl={staticMapUrl(outing.plan)} />
      <a href={`/api/outings/${outing.id}/ics`} className="block">
        <div className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-center text-base font-semibold">
          Add to calendar
        </div>
      </a>
      <p className="text-center text-xs text-[var(--muted)]">
        Made with Dately · one plan, one reroll, go
      </p>
    </Shell>
  );
}
