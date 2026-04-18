import type { PayloadHandler } from "payload";
import { RESTAURANTS } from "./restaurants";

export const restaurantConfigHandler: PayloadHandler = (req) => {
  const url = new URL(req.url!);
  const slug = url.searchParams.get("restaurant");

  if (!slug) {
    return Response.json({ error: "Missing restaurant param" }, { status: 400 });
  }

  const config = RESTAURANTS.find((r) => r.value === slug);

  if (!config) {
    return Response.json({ error: "Unknown restaurant" }, { status: 404 });
  }

  return Response.json({ slug: config.value, label: config.label, type: config.type });
};
