"use client";

import { use, useEffect, useState } from "react";
import { Button, Card, Pill, Shell, Wordmark } from "@/components/ui";
import {
  BUDGET_LABELS,
  RADIUS_LABELS,
  VIBE_LABELS,
} from "@/lib/format";
import { track } from "@/lib/analytics";
import {
  BUDGET_BANDS,
  CONSTRAINT_TAGS,
  RADIUS_OPTIONS,
  VIBES,
  type BudgetBand,
  type ConstraintTag,
  type Radius,
  type Vibe,
} from "@/lib/types";

const HARD_NO_CHOICES: ConstraintTag[] = [
  "loud",
  "long_walk",
  "spicy",
  "museum",
  "outdoor_cold",
  "bar_heavy",
];
const MUST_HAVE_CHOICES: ConstraintTag[] = [
  "vegetarian",
  "vegan",
  "dog_friendly",
  "wheelchair",
  "photo_friendly",
  "quiet_talk",
];

const TAG_LABELS: Record<ConstraintTag, string> = {
  loud: "Loud spots",
  long_walk: "Long walks",
  spicy: "Spicy food",
  museum: "Museums",
  outdoor_cold: "Cold outdoors",
  bar_heavy: "Bar-heavy",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  dog_friendly: "Dog-friendly",
  wheelchair: "Wheelchair access",
  photo_friendly: "Good for photos",
  quiet_talk: "Quiet enough to talk",
};

export default function JoinPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = use(params);
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "missing">(
    "loading",
  );

  const [budgetBand, setBudgetBand] = useState<BudgetBand>("20to40");
  const [radius, setRadius] = useState<Radius>("anywhere_philly");
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [hardNos, setHardNos] = useState<ConstraintTag[]>([]);
  const [mustHaves, setMustHaves] = useState<ConstraintTag[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/join/${shareToken}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((o) => setStatus(o.accepted ? "done" : "ready"))
      .catch(() => setStatus("missing"));
  }, [shareToken]);

  function toggle<T>(list: T[], value: T, set: (v: T[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function submit() {
    if (vibes.length === 0) {
      setError("Pick at least one vibe");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/join/${shareToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          budgetBand,
          radius,
          vibes,
          hardNos,
          mustHaves,
        }),
      });
      if (!res.ok) throw new Error("Could not submit — try again");
      track("constraints_submitted", {});
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <Shell>
        <Wordmark />
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </Shell>
    );
  }

  if (status === "missing") {
    return (
      <Shell>
        <Wordmark />
        <Card>
          <p className="text-sm">This outing link isn&apos;t valid anymore.</p>
        </Card>
      </Shell>
    );
  }

  if (status === "done") {
    return (
      <Shell>
        <Wordmark tag="You're in" />
        <Card>
          <h1 className="text-lg font-bold">Thanks — you&apos;re set 🎉</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The organizer will pull the plan together once everyone&apos;s in.
            You can close this.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Wordmark tag="30 seconds, no account" />

      <Card>
        <h1 className="text-lg font-bold">What are you up for?</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Your answers get blended with everyone else&apos;s. We take the
          tightest budget and everyone&apos;s hard nos seriously.
        </p>

        <div className="mt-5 space-y-5">
          <Group label="Budget per person">
            {(Object.keys(BUDGET_BANDS) as BudgetBand[]).map((b) => (
              <Pill key={b} selected={budgetBand === b} onClick={() => setBudgetBand(b)}>
                {BUDGET_LABELS[b]}
              </Pill>
            ))}
          </Group>

          <Group label="How far will you go?">
            {RADIUS_OPTIONS.map((r) => (
              <Pill key={r} selected={radius === r} onClick={() => setRadius(r)}>
                {RADIUS_LABELS[r]}
              </Pill>
            ))}
          </Group>

          <Group label="Vibe (pick any)">
            {VIBES.map((v) => (
              <Pill key={v} selected={vibes.includes(v)} onClick={() => toggle(vibes, v, setVibes)}>
                {VIBE_LABELS[v]}
              </Pill>
            ))}
          </Group>

          <Group label="Hard nos">
            {HARD_NO_CHOICES.map((t) => (
              <Pill key={t} selected={hardNos.includes(t)} onClick={() => toggle(hardNos, t, setHardNos)}>
                {TAG_LABELS[t]}
              </Pill>
            ))}
          </Group>

          <Group label="Must-haves">
            {MUST_HAVE_CHOICES.map((t) => (
              <Pill
                key={t}
                selected={mustHaves.includes(t)}
                onClick={() => toggle(mustHaves, t, setMustHaves)}
              >
                {TAG_LABELS[t]}
              </Pill>
            ))}
          </Group>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Name <span className="font-normal text-[var(--muted)]">(optional)</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="So the organizer knows who answered"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-base"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-[var(--brand)]">{error}</p> : null}

        <div className="mt-6">
          <Button type="button" onClick={submit} disabled={busy}>
            {busy ? "Sending…" : "Send my answers"}
          </Button>
        </div>
      </Card>
    </Shell>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
