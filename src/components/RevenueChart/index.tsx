"use client";

interface DayRevenue {
  date: string;
  revenue: number;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RevenueChart({ data }: { data?: DayRevenue[] }) {
  if (!data?.length) return null;

  const max = Math.max(...data.map((d) => d.revenue), 1);
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      style={{
        background: "var(--theme-elevation-50)",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: 10,
        padding: "20px 24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--theme-elevation-400)", fontWeight: 500, marginBottom: 2 }}>
            Revenue — Last 7 Days
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--theme-text)", letterSpacing: "-0.01em" }}>
            €{total.toFixed(2)}
          </div>
        </div>
        <span style={{ fontSize: 11, color: "var(--theme-elevation-400)", background: "var(--theme-elevation-100)", padding: "3px 8px", borderRadius: 20, fontWeight: 500 }}>
          7-day total
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
        {data.map(({ date, revenue }) => {
          const heightPct = (revenue / max) * 100;
          const day = DAY_SHORT[new Date(date).getDay()];
          const isToday = date === todayStr;

          return (
            <div
              key={date}
              title={`€${revenue.toFixed(2)}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}
            >
              {revenue > 0 && (
                <span style={{ fontSize: 10, color: "var(--theme-elevation-400)", fontWeight: 500 }}>
                  €{Math.round(revenue)}
                </span>
              )}
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(heightPct, revenue > 0 ? 6 : 2)}%`,
                  background: isToday ? "var(--theme-text)" : "var(--theme-elevation-250)",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.4s ease",
                  opacity: isToday ? 1 : 0.5,
                }}
              />
              <span style={{
                fontSize: 11,
                color: isToday ? "var(--theme-text)" : "var(--theme-elevation-400)",
                fontWeight: isToday ? 700 : 400,
              }}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
