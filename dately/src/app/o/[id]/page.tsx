"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Pill, Shell, Wordmark } from "@/components/ui";
import { PlanView } from "@/components/PlanView";
import { REROLL_REASON_LABELS } from "@/lib/format";
import { track } from "@/lib/analytics";
import { REROLL_REASONS, type Outing, type RerollReason } from "@/lib/types";

type State = Outing & { organizerToken?: string };

export default function OrganizerConsole({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const search = useSearchParams();
  const k = search.get("k");

  const [outing, setOuting] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/outings/${id}?k=${k}`);
    if (res.ok) setOuting(await res.json());
    else setError("This organizer link isn't valid.");
  }, [id, k]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll the waiting room until a plan exists.
  useEffect(() => {
    if (!outing || outing.plan) return;
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [outing, refresh]);

  async function act(path: string, body?: unknown, event?: () => void) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/outings/${id}/${path}?k=${k}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Something went wrong");
      setOuting(data);
      event?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (error && !outing) {
    return (
      <Shell>
        <Wordmark />
        <Card>
          <p className="text-sm text-[var(--brand)]">{error}</p>
        </Card>
      </Shell>
    );
  }

  if (!outing) {
    return (
      <Shell>
        <Wordmark />
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </Shell>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/j/${outing.shareToken}`
      : "";
  const cardUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/card/${outing.id}`
      : "";

  async function copy(text: string, after?: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      after?.();
    } catch {
      /* clipboard blocked; user can long-press to copy */
    }
  }

  // --- Accepted: final card + calendar + outcome prompt ---
  if (outing.accepted && outing.plan) {
    return (
      <Shell>
        <Wordmark tag="Locked in" />
        <PlanView plan={outing.plan} />
        <div className="space-y-2">
          <Button
            onClick={() =>
              copy(cardUrl, () => {
                setShareCopied(true);
                track("plan_shared", {});
              })
            }
          >
            {shareCopied ? "Copied plan link ✓" : "Copy plan to share in chat"}
          </Button>
          <a href={`/api/outings/${outing.id}/ics`} className="block">
            <Button variant="ghost">Add to calendar</Button>
          </a>
        </div>
        <OutcomePrompt outing={outing} onRecord={(o) => act("outcome", o, () => track("outing_went_out", o))} busy={busy} />
      </Shell>
    );
  }

  // --- Reveal: one plan, accept or reroll once ---
  if (outing.plan) {
    return (
      <Shell>
        <Wordmark tag="Here's your plan" />
        <PlanView plan={outing.plan} />
        {error ? <p className="text-sm text-[var(--brand)]">{error}</p> : null}
        <div className="space-y-3">
          <Button onClick={() => act("accept", undefined, () => track("plan_accepted", {}))} disabled={busy}>
            Lock it in
          </Button>

          {outing.rerollUsed ? (
            <p className="text-center text-xs text-[var(--muted)]">
              You&apos;ve used your one reroll — this is the plan.
            </p>
          ) : (
            <RerollControl
              disabled={busy}
              onReroll={(reason) =>
                act("reroll", { reason }, () => track("plan_rerolled", { reason }))
              }
            />
          )}
        </div>
      </Shell>
    );
  }

  // --- Waiting room: share link + responses + generate ---
  return (
    <Shell>
      <Wordmark tag="Waiting room" />
      <Card>
        <h1 className="text-lg font-bold">Share this in the group chat</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Everyone taps it and answers a few questions. No app needed.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-2">
          <span className="truncate text-sm">{shareUrl}</span>
        </div>
        <div className="mt-3">
          <Button onClick={() => copy(shareUrl, () => setShareCopied(true))}>
            {shareCopied ? "Copied ✓" : "Copy link"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Responses</h2>
          <span className="text-sm text-[var(--muted)]">
            {outing.submissions.length} in
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {outing.submissions.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">No answers yet.</li>
          ) : (
            outing.submissions.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{s.name || `Guest ${i + 1}`}</span>{" "}
                <span className="text-[var(--muted)]">
                  · {s.vibes.join(", ")}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>

      {error ? <p className="text-sm text-[var(--brand)]">{error}</p> : null}

      <Button
        onClick={() => act("generate", undefined, () => track("plan_generated", {}))}
        disabled={busy || outing.submissions.length === 0}
      >
        {busy ? "Finding your plan…" : "Generate the plan"}
      </Button>
      <p className="text-center text-xs text-[var(--muted)]">
        Don&apos;t wait on stragglers — generate once enough people are in.
      </p>
    </Shell>
  );
}

function RerollControl({
  onReroll,
  disabled,
}: {
  onReroll: (reason: RerollReason) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<RerollReason | null>(null);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} disabled={disabled}>
        Not it — reroll once
      </Button>
    );
  }

  return (
    <Card>
      <p className="text-sm font-semibold">Why isn&apos;t this it?</p>
      <p className="mb-3 mt-1 text-xs text-[var(--muted)]">
        Pick a reason so the next plan is actually better. You only get one.
      </p>
      <div className="flex flex-wrap gap-2">
        {REROLL_REASONS.map((r) => (
          <Pill key={r} selected={reason === r} onClick={() => setReason(r)}>
            {REROLL_REASON_LABELS[r]}
          </Pill>
        ))}
      </div>
      <div className="mt-4">
        <Button disabled={!reason || disabled} onClick={() => reason && onReroll(reason)}>
          Reroll with this reason
        </Button>
      </div>
    </Card>
  );
}

function OutcomePrompt({
  outing,
  onRecord,
  busy,
}: {
  outing: Outing;
  onRecord: (o: { wentOut: boolean; thumbsUp?: boolean }) => void;
  busy: boolean;
}) {
  if (outing.outcome) {
    return (
      <Card>
        <p className="text-sm">
          Thanks for closing the loop — this is the data that makes Dately
          better. {outing.outcome.wentOut ? "Glad you went! 🎉" : "Maybe next time."}
        </p>
      </Card>
    );
  }
  return (
    <Card>
      <p className="text-sm font-semibold">After the outing</p>
      <p className="mb-3 mt-1 text-xs text-[var(--muted)]">
        Did you actually go? This is the one number we care about.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" disabled={busy} onClick={() => onRecord({ wentOut: true, thumbsUp: true })}>
          We went 👍
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => onRecord({ wentOut: false })}>
          We didn&apos;t
        </Button>
      </div>
    </Card>
  );
}
