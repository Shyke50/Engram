import type { Plan } from "@/lib/types";

/**
 * Build a Mapbox Static Images URL with a numbered pin per stop. Returns null
 * when no MAPBOX_TOKEN is configured, in which case the UI falls back to a
 * plain route list — an image is nice-to-have, not load-bearing, for the MVP.
 */
export function staticMapUrl(
  plan: Plan,
  { width = 640, height = 320 }: { width?: number; height?: number } = {},
): string | null {
  const token = process.env.MAPBOX_TOKEN;
  if (!token || plan.stops.length === 0) return null;

  const markers = plan.stops
    .map((s, i) => `pin-s-${i + 1}+f97316(${s.item.lng},${s.item.lat})`)
    .join(",");

  return (
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `${markers}/auto/${width}x${height}@2x?padding=60&access_token=${token}`
  );
}
