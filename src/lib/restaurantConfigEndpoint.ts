import type { PayloadHandler } from "payload";

export const restaurantConfigHandler: PayloadHandler = async (req) => {
  const url = new URL(req.url!);
  const slug = url.searchParams.get("restaurant");

  if (!slug) {
    return Response.json({ error: "Missing restaurant param" }, { status: 400 });
  }

  const result = await req.payload.find({
    collection: "restaurants",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });

  const config = result.docs[0];

  if (!config) {
    return Response.json({ error: "Unknown restaurant" }, { status: 404 });
  }

  return Response.json({
    slug: config.slug,
    label: config.name,
    type: config.type,
    onlineOrdering: config.onlineOrdering ?? false,
  });
};
