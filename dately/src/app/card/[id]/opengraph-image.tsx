import { ImageResponse } from "next/og";
import { getStore } from "@/lib/store";
import { formatCost } from "@/lib/format";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Dately plan";

/**
 * The link unfurl IS the "share in the group chat" mechanic, so this renders an
 * invitation-looking card rather than a bare URL. Kept to core fonts and flex
 * layout so it works in the edge/runtime image renderer.
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outing = await getStore().getById(id);
  const plan = outing?.plan;

  const stops = plan?.stops.map((s) => s.item.name) ?? ["Your Philly plan"];
  const cost = plan ? `${formatCost(plan.costPerPerson)} / person` : "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fbf7f2",
          padding: "72px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#e5533c" }}>
            dately
          </div>
          <div style={{ fontSize: 28, color: "#6b6058", marginTop: 8 }}>
            One plan. One reroll. Go.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {stops.map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  background: "#e5533c",
                  color: "white",
                  fontSize: 30,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 46, fontWeight: 700, color: "#1f1a17" }}>
                {name}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 30, color: "#6b6058" }}>{cost}</div>
      </div>
    ),
    size,
  );
}
