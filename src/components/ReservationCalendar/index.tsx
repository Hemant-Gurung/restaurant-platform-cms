"use client";

import { useEffect, useState } from "react";

interface Reservation {
  date: string;
  status: string;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// 0=Sun…6=Sat → Mon-first index (0=Mon…6=Sun)
function mondayFirst(day: number) {
  return (day + 6) % 7;
}

export default function ReservationCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 1).toISOString();

    fetch(
      `/api/reservations?where[date][greater_than_equal]=${start}&where[date][less_than]=${end}&where[status][not_equals]=CANCELLED&limit=500&depth=0`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((data: { docs?: Reservation[] }) => {
        const map: Record<string, number> = {};
        for (const r of data.docs ?? []) {
          const day = new Date(r.date).getDate();
          map[day] = (map[day] ?? 0) + 1;
        }
        setCounts(map);
      })
      .catch(() => setCounts({}))
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = mondayFirst(new Date(year, month, 1).getDay());
  const today = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1;

  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{
            background: "none",
            border: "1px solid var(--theme-elevation-200)",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            color: "var(--theme-text)",
            fontSize: 14,
          }}
        >
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: 15, minWidth: 160, textAlign: "center" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{
            background: "none",
            border: "1px solid var(--theme-elevation-200)",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            color: "var(--theme-text)",
            fontSize: 14,
          }}
        >
          ›
        </button>
        {loading && (
          <span style={{ fontSize: 12, color: "var(--theme-elevation-400)" }}>Loading…</span>
        )}
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--theme-elevation-400)",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const count = counts[day] ?? 0;
          const isToday = day === today;

          return (
            <div
              key={day}
              style={{
                background: isToday
                  ? "var(--theme-elevation-150)"
                  : "var(--theme-elevation-50)",
                border: `1px solid ${isToday ? "var(--theme-text)" : "var(--theme-elevation-150)"}`,
                borderRadius: 6,
                padding: "8px 4px",
                minHeight: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: "var(--theme-text)" }}>
                {day}
              </span>
              {count > 0 && (
                <span
                  style={{
                    background: "var(--theme-success-500)",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "1px 7px",
                    lineHeight: 1.6,
                  }}
                >
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
