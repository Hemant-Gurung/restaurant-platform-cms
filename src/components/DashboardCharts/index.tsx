"use client";

import { useEffect, useState } from "react";
import RevenueChart from "@/components/RevenueChart";
import TopSellingItems from "@/components/TopSellingItems";
import UpcomingReservations from "@/components/UpcomingReservations";

interface ChartData {
  revenueByDay: { date: string; revenue: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
  upcomingToday: { id: string; name: string; date: string; partySize: number; status: string; type: string }[];
}

export default function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard-chart", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d as ChartData))
      .catch(() => null);
  }, []);

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--theme-elevation-50)",
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: 8,
              height: 160,
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
      <RevenueChart data={data.revenueByDay} />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <UpcomingReservations data={data.upcomingToday} />
        <TopSellingItems data={data.topItems} />
      </div>
    </div>
  );
}
