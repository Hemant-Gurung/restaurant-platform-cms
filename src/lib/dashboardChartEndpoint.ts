import type { PayloadHandler, Where } from "payload";

export const dashboardChartHandler: PayloadHandler = async (req) => {
  const { user } = await req.payload.auth({ headers: req.headers });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = (user as unknown as Record<string, unknown>)?.restaurant as string | undefined;
  const baseWhere: Where = restaurant ? { restaurant: { equals: restaurant } } : {};

  const now = new Date();

  // Last 7 days range
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Month range for top items
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [recentOrders, monthOrders, todayReservations] = await Promise.all([
    req.payload.find({
      collection: "orders",
      where: {
        ...baseWhere,
        createdAt: { greater_than_equal: sevenDaysAgo.toISOString(), less_than: tomorrow.toISOString() },
        status: { not_equals: "cancelled" },
      },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: "orders",
      where: {
        ...baseWhere,
        createdAt: { greater_than_equal: monthStart.toISOString() },
        status: { not_equals: "cancelled" },
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: "reservations",
      where: {
        ...baseWhere,
        date: {
          greater_than_equal: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
          less_than: tomorrow.toISOString(),
        },
        status: { not_equals: "CANCELLED" },
      },
      sort: "date",
      limit: 50,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  // Revenue by day for last 7 days
  const revenueMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    revenueMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const order of recentOrders.docs as { createdAt?: string; total?: number }[]) {
    const day = (order.createdAt ?? "").slice(0, 10);
    if (day in revenueMap) revenueMap[day] = (revenueMap[day] ?? 0) + (order.total ?? 0);
  }
  const revenueByDay = Object.entries(revenueMap).map(([date, revenue]) => ({ date, revenue }));

  // Top selling items this month
  const itemMap: Record<string, { quantity: number; revenue: number }> = {};
  for (const order of monthOrders.docs as { items?: { name: string; price: number; quantity: number }[] }[]) {
    for (const item of order.items ?? []) {
      if (!itemMap[item.name]) itemMap[item.name] = { quantity: 0, revenue: 0 };
      itemMap[item.name].quantity += item.quantity;
      itemMap[item.name].revenue += item.price * item.quantity;
    }
  }
  const topItems = Object.entries(itemMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return Response.json({
    revenueByDay,
    topItems,
    upcomingToday: todayReservations.docs,
  });
};
