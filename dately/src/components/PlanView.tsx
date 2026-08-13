import { Card } from "@/components/ui";
import { formatCost, formatTime } from "@/lib/format";
import type { Plan } from "@/lib/types";

/** Renders a plan as an ordered, timed itinerary with a "why" per stop. */
export function PlanView({ plan, mapUrl }: { plan: Plan; mapUrl?: string | null }) {
  return (
    <div className="space-y-4">
      {mapUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mapUrl}
          alt="Map of the plan's stops"
          className="w-full rounded-2xl border border-[var(--line)]"
        />
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">
          {formatCost(plan.costPerPerson)} / person
        </span>
        <span className="text-[var(--muted)]">
          {Math.round(plan.totalDurationMin / 60)}h {plan.totalDurationMin % 60}m
        </span>
      </div>

      <ol className="space-y-3">
        {plan.stops.map((stop, i) => (
          <li key={`${stop.item.id}-${i}`}>
            <Card className="!p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate font-bold">{stop.item.name}</h3>
                    <span className="shrink-0 text-sm text-[var(--muted)]">
                      {formatTime(stop.startMinute)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{stop.why}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {formatCost(stop.item.costPerPerson)} · {stop.item.durationMin} min
                    {stop.item.reservationNeeded ? " · reservation" : ""}
                  </p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <p className="px-1 text-xs text-[var(--muted)]">{plan.rationale}</p>
    </div>
  );
}
