"use client";

interface Reservation {
  id: string;
  name: string;
  date: string;
  partySize: number;
  status: string;
  type: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CONFIRMED: { color: "#16a34a", bg: "#dcfce7", label: "Confirmed" },
  PENDING:   { color: "#d97706", bg: "#fef3c7", label: "Pending" },
  CANCELLED: { color: "#dc2626", bg: "#fee2e2", label: "Cancelled" },
};

export default function UpcomingReservations({ data }: { data: Reservation[] }) {
  return (
    <div
      style={{
        background: "var(--theme-elevation-50)",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: 10,
        padding: "20px 24px",
        flex: 1,
        minWidth: 260,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--theme-text)" }}>
          Reservations Today
        </span>
        {data.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, background: "var(--theme-text)", color: "var(--theme-bg)", borderRadius: 20, padding: "2px 8px" }}>
            {data.length}
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--theme-elevation-400)", margin: 0 }}>No reservations today.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((r) => {
            const time = new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const s = STATUS_CONFIG[r.status] ?? { color: "var(--theme-elevation-400)", bg: "var(--theme-elevation-100)", label: r.status };

            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--theme-elevation-100)",
                  borderRadius: 8,
                  borderLeft: `3px solid ${s.color}`,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 44, color: "var(--theme-text)", fontVariantNumeric: "tabular-nums" }}>
                  {time}
                </span>
                <span style={{ fontSize: 13, color: "var(--theme-text)", flex: 1, fontWeight: 500 }}>
                  {r.name}
                </span>
                <span style={{ fontSize: 12, color: "var(--theme-elevation-500)", whiteSpace: "nowrap" }}>
                  {r.partySize} pax
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: s.color,
                  background: s.bg,
                  borderRadius: 6,
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
