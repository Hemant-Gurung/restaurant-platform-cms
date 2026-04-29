import type { PayloadHandler } from "payload";

export const dashboardStatsHandler: PayloadHandler = async (req) => {
  const { user } = await req.payload.auth({ headers: req.headers });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = (user as unknown as Record<string, unknown>)?.restaurant as string | undefined;
  const baseWhere = restaurant ? { restaurant: { equals: restaurant } } : {};

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrowStart = new Date(new Date(todayStart).getTime() + 86_400_000).toISOString();
  const yesterdayStart = new Date(new Date(todayStart).getTime() - 86_400_000).toISOString();

  const [todayOrders, yesterdayOrders, todayBookings, yesterdayBookings] = await Promise.all([
    req.payload.find({
      collection: "orders",
      where: { ...baseWhere, createdAt: { greater_than_equal: todayStart, less_than: tomorrowStart }, status: { not_equals: "cancelled" } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: "orders",
      where: { ...baseWhere, createdAt: { greater_than_equal: yesterdayStart, less_than: todayStart }, status: { not_equals: "cancelled" } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: "reservations",
      where: { ...baseWhere, date: { greater_than_equal: todayStart, less_than: tomorrowStart }, status: { not_equals: "CANCELLED" } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
    req.payload.find({
      collection: "reservations",
      where: { ...baseWhere, date: { greater_than_equal: yesterdayStart, less_than: todayStart }, status: { not_equals: "CANCELLED" } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  const sumTotal = (docs: unknown[]) =>
    (docs as { total?: number }[]).reduce((sum, d) => sum + (d.total ?? 0), 0);

  return Response.json({
    revenueToday: sumTotal(todayOrders.docs),
    revenueYesterday: sumTotal(yesterdayOrders.docs),
    ordersToday: todayOrders.totalDocs,
    ordersYesterday: yesterdayOrders.totalDocs,
    bookingsToday: todayBookings.totalDocs,
    bookingsYesterday: yesterdayBookings.totalDocs,
  });
};
