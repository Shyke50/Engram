"use client";

import { useState } from "react";
import { Button, Pill } from "@/components/ui";

interface CatalogLite {
  id: string;
  name: string;
  category: string;
  openHour: number;
}

/**
 * Compose a plan by hand: pick catalog items in order, and each is scheduled
 * back-to-back starting at its own opening hour. Deliberately minimal — this is
 * a curator escape hatch, not a full editor.
 */
export function AdminOverride({
  outingId,
  token,
  catalog,
}: {
  outingId: string;
  token: string;
  catalog: CatalogLite[];
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    let cursor = 17 * 60;
    const stops = picked.map((itemId) => {
      const item = catalog.find((c) => c.id === itemId)!;
      const startMinute = Math.max(cursor, item.openHour * 60);
      cursor = startMinute + 90;
      return { itemId, startMinute };
    });
    try {
      const res = await fetch(`/api/admin/outings/${outingId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ stops }),
      });
      if (!res.ok) throw new Error("Override failed");
      setMsg("Plan overridden ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="mt-2 text-xs text-[var(--brand)] underline"
        onClick={() => setOpen(true)}
      >
        override plan by hand
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--line)] p-3">
      <p className="mb-2 text-xs font-semibold">
        Pick stops in order ({picked.length} selected)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {catalog.map((c) => (
          <Pill key={c.id} selected={picked.includes(c.id)} onClick={() => toggle(c.id)}>
            {c.name}
          </Pill>
        ))}
      </div>
      <div className="mt-3">
        <Button disabled={picked.length === 0 || busy} onClick={save}>
          {busy ? "Saving…" : "Save override"}
        </Button>
      </div>
      {msg ? <p className="mt-2 text-xs text-[var(--muted)]">{msg}</p> : null}
    </div>
  );
}
