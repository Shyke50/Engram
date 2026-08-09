# Dately

**One plan. One reroll. Go.**

Dately is a *decision engine* for going out, not another discovery app. A group
(or a couple) drops their budget, vibe, radius and hard-nos from a shared link,
and Dately hands back exactly **one** curated Philadelphia plan. Accept it, or
spend the group's single **reroll** — with a reason, so the second pick is
better rather than just different. The second plan is final.

This repository is the link-first web MVP. It is intentionally a standalone
app (its own `package.json`, no ties to anything around it) so it can be lifted
into its own repository at any time.

## Why it exists

Group planning fails at the *decision* step, not the *discovery* step. Yelp,
Google Maps and the whole "moves" cluster make it easier to see options, which
makes it *harder* to decide. Dately removes the browsing and ends the debate.
See [`PRODUCT.md`](./PRODUCT.md) for the full product thinking.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

No configuration is required. With no `.env`, the app runs on an in-memory
store and the checked-in Philly catalog — enough to click through the entire
flow. Copy `.env.example` to `.env.local` to add Postgres, a Mapbox token, an
admin token, or PostHog analytics.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm test` | Run the matcher unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` / `npm run db:push` | Drizzle migrations (Postgres) |
| `npm run catalog:sync` | Rebuild the catalog from `data/catalog.json` |

## The five screens

1. **Create** (`/`) — organizer picks couple/group, day, time; gets a link.
2. **Constraints** (`/j/[shareToken]`) — anyone opens the link, answers in ~30s,
   no account.
3. **Waiting room** (`/o/[id]?k=…`) — organizer sees responses, generates once
   enough people are in.
4. **Reveal** — one plan, with a "why" per stop. Accept or reroll once.
5. **Plan card** (`/card/[id]`) — clean, shareable card with a generated link
   preview, static map and add-to-calendar. Plus a post-outing "did you go?"
   prompt — the one number that matters.

An admin console (`/admin`) lets a curator override any plan by hand.

## Architecture

```
src/
  lib/
    types.ts        Domain model + zod schemas (shared vocabulary)
    matcher.ts      PURE function: catalog + submissions -> ranked plans
    matcher.test.ts Unit tests against fixture catalogs
    outings.ts      Service layer: state transitions + rules (one reroll, etc.)
    catalog/        Curated venue/activity data (sync target, versioned)
    store/          OutingStore interface + memory + postgres impls
    db/schema.ts    Drizzle schema (outing state only; catalog is in-repo)
    ics.ts map.ts analytics.ts format.ts env.ts auth.ts admin.ts
  components/       PlanView + small UI primitives
  app/              Next.js App Router: pages + /api route handlers
```

Two deliberate decisions:

- **The matcher is a pure function** with no I/O, so it's unit-testable and
  tunable in isolation. It's the piece that will be iterated on the most.
- **Curators work outside the app** — the catalog is authored in a spreadsheet
  and synced into the repo. See [`docs/CURATION.md`](./docs/CURATION.md).

## Status

MVP scaffold. The catalog under `src/lib/catalog/philly.ts` is **placeholder
data** — real names, invented attributes — meant to exercise the matcher, not
to send anyone out the door. Replace it via the curation sync before real use.

Out of scope for the MVP (by design): native apps, participant accounts,
payments, real reservations, Journeys, the public map, and any browsable
"list of options" surface.
