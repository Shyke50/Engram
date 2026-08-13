import type { Outing } from "@/lib/types";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Build an all-local-time .ics for the accepted plan. Times are written as
 * floating (no TZ) values anchored to the outing day + first stop start, which
 * is correct for "add this to my calendar in my own timezone" without pulling
 * in a tz database.
 */
export function buildIcs(outing: Outing, baseUrl: string): string {
  const plan = outing.plan;
  if (!plan || plan.stops.length === 0) {
    throw new Error("Cannot build calendar file without a plan");
  }

  const [y, m, d] = outing.day.split("-").map(Number);
  const first = plan.stops[0];
  const last = plan.stops[plan.stops.length - 1];
  const startMin = first.startMinute;
  const endMin = last.startMinute + last.item.durationMin;

  const dt = (minute: number) =>
    `${y}${pad(m)}${pad(d)}T${pad(Math.floor(minute / 60))}${pad(minute % 60)}00`;

  const summary = `Dately: ${plan.stops.map((s) => s.item.name).join(" → ")}`;
  const description = plan.stops
    .map((s, i) => `${i + 1}. ${s.item.name} — ${s.why}`)
    .join("\\n");
  const url = `${baseUrl}/card/${outing.id}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dately//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${outing.id}@dately`,
    `DTSTAMP:${dt(startMin)}`,
    `DTSTART:${dt(startMin)}`,
    `DTEND:${dt(endMin)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
