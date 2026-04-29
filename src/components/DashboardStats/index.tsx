"use client";

import { useEffect, useState } from "react";

interface Stats {
  revenueToday: number;
  revenueYesterday: number;
  ordersToday: number;
  ordersYesterday: number;
  bookingsToday: number;
  bookingsYesterday: number;
}

function trend(today: number, yesterday: number) {
  if (yesterday === 0) return { label: today > 0 ? "New today" : "No data yet", up: null };
  const diff = today - yesterday;
  const pct = Math.round((diff / yesterday) * 100);
  return { label: `${diff >= 0 ? "+" : ""}${pct}% vs yesterday`, up: diff >= 0 };
}

interface StatCardProps {
  label: string;
  value: string;
  trend: { label: string; up: boolean | null };
  icon: string;
  accent?: boolean;
}

function StatCard({ label, value, trend: t, icon, accent }: StatCardProps) {
  return (
    <div
      style={{
        background: accent ? "var(--theme-text)" : "var(--theme-elevation-50)",
        border: `1px solid ${accent ? "var(--theme-text)" : "var(--theme-elevation-150)"}`,
        borderRadius: 10,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
        minWidth: 180,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: accent ? "var(--theme-bg)" : "var(--theme-elevation-400)", fontWeight: 500, opacity: accent ? 0.7 : 1 }}>
          {label}
        </span>
        <span style={{ fontSize: 18, opacity: 0.8 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: accent ? "var(--theme-bg)" : "var(--theme-text)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        color: accent
          ? "var(--theme-bg)"
          : t.up === null
            ? "var(--theme-elevation-400)"
            : t.up
              ? "var(--theme-success-500)"
              : "var(--theme-error-500)",
        opacity: accent ? 0.65 : 1,
      }}>
        {t.label}
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard-stats", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setStats(data as Stats))
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  if (!stats) {
    return (
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ background: "var(--theme-elevation-50)", border: "1px solid var(--theme-elevation-150)", borderRadius: 10, flex: 1, minWidth: 180, height: 108, opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      <StatCard
        label="Revenue Today"
        value={`€${stats.revenueToday.toFixed(2)}`}
        trend={trend(stats.revenueToday, stats.revenueYesterday)}
        icon="💶"
        accent
      />
      <StatCard
        label="Orders Today"
        value={String(stats.ordersToday)}
        trend={trend(stats.ordersToday, stats.ordersYesterday)}
        icon="🧾"
      />
      <StatCard
        label="Bookings Today"
        value={String(stats.bookingsToday)}
        trend={trend(stats.bookingsToday, stats.bookingsYesterday)}
        icon="📅"
      />
    </div>
  );
}
