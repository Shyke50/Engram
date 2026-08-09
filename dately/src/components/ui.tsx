import type { ReactNode } from "react";

/** Small shared presentational primitives, kept dependency-free. */

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-10">
      {children}
    </main>
  );
}

export function Wordmark({ tag }: { tag?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xl font-extrabold tracking-tight text-[var(--brand)]">
        dately
      </span>
      {tag ? <span className="text-sm text-[var(--muted)]">{tag}</span> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const base =
    "w-full rounded-xl px-4 py-3 text-center text-base font-semibold transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-[var(--brand)] text-white hover:brightness-105"
      : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--background)]";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  selected = false,
  onClick,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        selected
          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--accent)]"
      }`}
    >
      {children}
    </button>
  );
}
