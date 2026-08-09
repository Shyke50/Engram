"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Pill, Shell, Wordmark } from "@/components/ui";
import { TIME_WINDOW_LABELS } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { PartyType, TimeWindow } from "@/lib/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreatePage() {
  const router = useRouter();
  const [partyType, setPartyType] = useState<PartyType>("couple");
  const [day, setDay] = useState(todayISO());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("evening");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/outings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyType, day, timeWindow }),
      });
      if (!res.ok) throw new Error("Could not create outing");
      const data = await res.json();
      track("outing_created", { partyType, timeWindow });
      router.push(`/o/${data.id}?k=${data.organizerToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <Shell>
      <Wordmark tag="One plan. One reroll. Go." />

      <Card>
        <h1 className="text-lg font-bold">Plan tonight in Philly</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tell us who&apos;s coming and when. Everyone drops their budget and
          vibe from a link — we hand back one plan.
        </p>

        <div className="mt-5 space-y-5">
          <Field label="Who's coming?">
            <div className="flex gap-2">
              <Pill selected={partyType === "couple"} onClick={() => setPartyType("couple")}>
                Just us two
              </Pill>
              <Pill selected={partyType === "group"} onClick={() => setPartyType("group")}>
                A group
              </Pill>
            </div>
          </Field>

          <Field label="Day">
            <input
              type="date"
              value={day}
              min={todayISO()}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-base"
            />
          </Field>

          <Field label="Time">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TIME_WINDOW_LABELS) as TimeWindow[]).map((tw) => (
                <Pill
                  key={tw}
                  selected={timeWindow === tw}
                  onClick={() => setTimeWindow(tw)}
                >
                  {TIME_WINDOW_LABELS[tw]}
                </Pill>
              ))}
            </div>
          </Field>
        </div>

        {error ? <p className="mt-4 text-sm text-[var(--brand)]">{error}</p> : null}

        <div className="mt-6">
          <Button type="button" onClick={create} disabled={busy}>
            {busy ? "Creating…" : "Create outing"}
          </Button>
        </div>
      </Card>

      <p className="px-2 text-center text-xs text-[var(--muted)]">
        Philly only for now. Your friends won&apos;t need to download anything —
        they just open the link.
      </p>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
