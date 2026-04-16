import type { PayloadHandler } from "payload";

/**
 * GET /api/availability
 *
 * Returns the table IDs that are already reserved for a given restaurant,
 * date, and time slot. The frontend uses this to colour the floor plan.
 *
 * Query params:
 *   restaurant  — restaurant slug  e.g. "my-restaurant"
 *   date        — ISO date string  e.g. "2026-04-15"
 *   time        — 12-hour time     e.g. "7:00 PM"
 *
 * Response:
 *   { reservedTableIds: string[] }
 *
 * A table is considered "reserved" when it has a non-CANCELLED reservation
 * whose date falls within ±2 hours of the requested slot. This covers the
 * typical ~1.5 hr dining window so customers can't book a table that is
 * about to be used or still occupied.
 */

function parseTimeString(time: string): { hours: number; minutes: number } | null {
  // Expects "7:00 PM" or "12:30 AM"
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

export const availabilityHandler: PayloadHandler = async (req) => {
  const url = new URL(req.url);
  const restaurant = url.searchParams.get("restaurant");
  const date = url.searchParams.get("date");
  const time = url.searchParams.get("time");

  // ── Validate params ────────────────────────────────────────────────────
  if (!restaurant || !date || !time) {
    return Response.json(
      { error: "Missing required query params: restaurant, date, time" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Invalid date format. Expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const parsed = parseTimeString(time);
  if (!parsed) {
    return Response.json(
      { error: "Invalid time format. Expected e.g. '7:00 PM'" },
      { status: 400 }
    );
  }

  // ── Build ±2 hour window around the requested slot ─────────────────────
  const slotTime = new Date(
    `${date}T${String(parsed.hours).padStart(2, "0")}:${String(parsed.minutes).padStart(2, "0")}:00`
  );

  if (isNaN(slotTime.getTime())) {
    return Response.json({ error: "Invalid date/time combination" }, { status: 400 });
  }

  const BLOCK_HOURS = 2;
  const windowStart = new Date(slotTime.getTime() - BLOCK_HOURS * 60 * 60 * 1000);
  const windowEnd = new Date(slotTime.getTime() + BLOCK_HOURS * 60 * 60 * 1000);

  // ── Query reservations ─────────────────────────────────────────────────
  try {
    const result = await req.payload.find({
      collection: "reservations",
      where: {
        and: [
          { restaurant: { equals: restaurant } },
          { status: { not_equals: "CANCELLED" } },
          { date: { greater_than_equal: windowStart.toISOString() } },
          { date: { less_than_equal: windowEnd.toISOString() } },
        ],
      },
      depth: 0,
      limit: 500,
      pagination: false,
    });

    // Extract table IDs (table field can be populated object or plain ID string)
    const reservedTableIds = result.docs
      .filter((r) => r.table)
      .map((r) =>
        typeof r.table === "string"
          ? r.table
          : (r.table as { id: string }).id
      );

    // Deduplicate
    const uniqueIds = [...new Set(reservedTableIds)];

    return Response.json({ reservedTableIds: uniqueIds });
  } catch (err) {
    req.payload.logger.error({ err }, "Availability endpoint error");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
