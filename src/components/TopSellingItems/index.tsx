"use client";

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309"];

export default function TopSellingItems({ data }: { data: TopItem[] }) {
  const max = Math.max(...data.map((i) => i.quantity), 1);

  return (
    <div
      style={{
        background: "var(--theme-elevation-50)",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: 10,
        padding: "20px 24px",
        flex: 1,
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: "var(--theme-text)" }}>
        Top Items — This Month
      </div>

      {data.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--theme-elevation-400)", margin: 0 }}>No orders this month yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((item, i) => {
            const rankColor = RANK_COLORS[i] ?? "var(--theme-elevation-300)";
            const isTop = i === 0;

            return (
              <div key={item.name}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isTop ? "#fff" : "var(--theme-elevation-500)",
                    background: isTop ? rankColor : "var(--theme-elevation-150)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    minWidth: 20,
                    textAlign: "center",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--theme-text)", flex: 1, fontWeight: isTop ? 600 : 400 }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--theme-elevation-500)" }}>
                    ×{item.quantity}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "var(--theme-elevation-150)", overflow: "hidden", marginLeft: 28 }}>
                  <div style={{
                    height: "100%",
                    width: `${(item.quantity / max) * 100}%`,
                    background: isTop ? rankColor : "var(--theme-elevation-300)",
                    borderRadius: 2,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
