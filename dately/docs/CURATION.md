# Curation Guide

Dately is a taste business wearing software clothes. The code is
straightforward; the product *is* whether the picks are good. This guide is how
curators author the catalog.

## Where the catalog lives

- **Authoring:** a spreadsheet (Airtable or Google Sheets). Curators are not
  engineers, and a spreadsheet is a genuinely good tool for tagging venues.
- **Source of truth in the repo:** `data/catalog.json`.
- **Generated code:** `src/lib/catalog/philly.ts` (do not hand-edit).

Flow: edit the spreadsheet → export to `data/catalog.json` → run
`npm run catalog:sync` → commit both files.

## Columns / fields

Each row is one venue or activity. All fields are required unless noted.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable slug, e.g. `zahav`. Never reuse. |
| `name` | string | Display name. |
| `category` | enum | `food` `drinks` `activity` `dessert` `outdoor` `culture` |
| `neighborhood` | enum | See `Neighborhood` in `src/lib/types.ts`. |
| `walkFromCenterMin` | number | Walking minutes from City Hall (radius filter). |
| `costPerPerson` | number | Typical spend per person, USD. |
| `durationMin` | number | How long groups spend here. |
| `vibeTags` | list | Any of `chill active food artsy nightlife celebrate`. Drives the score. |
| `tags` | list | Constraint tags this item carries (see below). |
| `partySizeMin` / `partySizeMax` | number | Inclusive party-size range. |
| `reservationNeeded` | bool | |
| `indoor` | bool | |
| `openHour` / `closeHour` | number | 24h local, `[open, close)`. |
| `curatorRating` | number | 0–5, your judgment. Breaks ties. |
| `lat` / `lng` | number | For the static map pins. |
| `why` | string | The one-liner shown under the stop. **This is the product.** |

### Constraint tags (`tags`)

These are the vocabulary shared with participants' hard-nos and must-haves, so
the matcher can compare directly:

`loud`, `long_walk`, `spicy`, `museum`, `outdoor_cold`, `bar_heavy`,
`vegetarian`, `vegan`, `dog_friendly`, `wheelchair`, `photo_friendly`,
`quiet_talk`

A participant's **hard no** excludes any item carrying that tag. A **must-have**
requires every item in the plan to carry it. Tag honestly: an untagged
`vegetarian` spot will never be shown to someone who needs it, and a mistagged
`quiet_talk` bar will get a plan rejected.

## Writing a good `why`

The `why` is the difference between "curated" and "random". One sentence, in a
friend's voice, that says *why this, for this group*.

- Good: "A dim basement cocktail room built for actually hearing each other."
- Bad: "Popular bar with good drinks."

## How much to curate

Launch targets: ~30–40 solid **date** plans-worth of items and ~15–20 **group**
plans-worth, enough that a returning couple doesn't see repeats for a couple of
months. Depth on dates first (see `PRODUCT.md`).

## Syncing

```bash
# after exporting the spreadsheet to data/catalog.json
npm run catalog:sync   # validates every row, regenerates philly.ts
```

The sync **fails loudly** on any invalid enum, missing field or bad type — a
bad row can't reach users. Fix the spreadsheet and re-run.
