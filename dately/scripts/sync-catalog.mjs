#!/usr/bin/env node
/**
 * Catalog sync: data/catalog.json  ->  src/lib/catalog/philly.ts
 *
 * Curators author in a spreadsheet and export to data/catalog.json. This script
 * validates every row and regenerates the typed catalog module. It fails loudly
 * on any bad row so invalid data can never reach users.
 *
 * Dependency-free on purpose (plain Node ESM), so it runs anywhere with no
 * build step. Run via `npm run catalog:sync`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "data", "catalog.json");
const OUT = join(root, "src", "lib", "catalog", "philly.ts");

const CATEGORIES = ["food", "drinks", "activity", "dessert", "outdoor", "culture"];
const NEIGHBORHOODS = [
  "center_city", "old_city", "fishtown", "south_philly", "university_city",
  "northern_liberties", "rittenhouse", "fairmount",
];
const VIBES = ["chill", "active", "food", "artsy", "nightlife", "celebrate"];
const TAGS = [
  "loud", "long_walk", "spicy", "museum", "outdoor_cold", "bar_heavy",
  "vegetarian", "vegan", "dog_friendly", "wheelchair", "photo_friendly", "quiet_talk",
];

function fail(msg) {
  console.error(`\n✗ catalog:sync — ${msg}\n`);
  process.exit(1);
}

function validate(item, i) {
  const where = `row ${i} (${item.id ?? "no id"})`;
  const str = (f) => typeof item[f] === "string" && item[f].length > 0 || fail(`${where}: '${f}' must be a non-empty string`);
  const num = (f) => typeof item[f] === "number" && Number.isFinite(item[f]) || fail(`${where}: '${f}' must be a number`);
  const bool = (f) => typeof item[f] === "boolean" || fail(`${where}: '${f}' must be a boolean`);
  const oneOf = (f, set) => set.includes(item[f]) || fail(`${where}: '${f}'='${item[f]}' not in ${set.join("|")}`);
  const listOf = (f, set) =>
    (Array.isArray(item[f]) && item[f].every((v) => set.includes(v))) ||
    fail(`${where}: '${f}' must be a list drawn from ${set.join("|")}`);

  str("id"); str("name"); str("why");
  oneOf("category", CATEGORIES);
  oneOf("neighborhood", NEIGHBORHOODS);
  num("walkFromCenterMin"); num("costPerPerson"); num("durationMin");
  listOf("vibeTags", VIBES); listOf("tags", TAGS);
  num("partySizeMin"); num("partySizeMax");
  bool("reservationNeeded"); bool("indoor");
  num("openHour"); num("closeHour"); num("curatorRating");
  num("lat"); num("lng");
  if (item.partySizeMin > item.partySizeMax) fail(`${where}: partySizeMin > partySizeMax`);
  if (item.openHour >= item.closeHour) fail(`${where}: openHour >= closeHour`);
}

const raw = JSON.parse(readFileSync(SRC, "utf8"));
if (!Array.isArray(raw)) fail("data/catalog.json must be a JSON array");

const ids = new Set();
raw.forEach((item, i) => {
  validate(item, i);
  if (ids.has(item.id)) fail(`duplicate id '${item.id}'`);
  ids.add(item.id);
});

// Emit a stable, ordered field set per item so diffs stay clean.
const FIELDS = [
  "id", "name", "category", "neighborhood", "walkFromCenterMin", "costPerPerson",
  "durationMin", "vibeTags", "tags", "partySizeMin", "partySizeMax",
  "reservationNeeded", "indoor", "openHour", "closeHour", "curatorRating",
  "lat", "lng", "why",
];

const body = raw
  .map((item) => {
    const lines = FIELDS.map((f) => `    ${f}: ${JSON.stringify(item[f])},`);
    return `  {\n${lines.join("\n")}\n  },`;
  })
  .join("\n");

const out = `import type { CatalogItem } from "@/lib/types";

// AUTO-GENERATED from data/catalog.json by scripts/sync-catalog.mjs.
// Do not hand-edit. Run \`npm run catalog:sync\` after editing the source.
export const PHILLY_CATALOG: CatalogItem[] = [
${body}
];
`;

writeFileSync(OUT, out);
console.log(`✓ catalog:sync — wrote ${raw.length} items to src/lib/catalog/philly.ts`);
