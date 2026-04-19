import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(req: NextRequest, { params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant: restaurantSlug } = await params;
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "restaurants",
    where: { slug: { equals: restaurantSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const restaurantDoc = result.docs[0] as
    | { stripeSecretKey?: string; stripeWebhookSecret?: string }
    | undefined;

  if (!restaurantDoc?.stripeSecretKey || !restaurantDoc?.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe not configured for this restaurant" }, { status: 400 });
  }

  const stripe = new Stripe(restaurantDoc.stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, restaurantDoc.stripeWebhookSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const items = lineItems.data.map((item) => ({
        name: item.description ?? "Item",
        price: (item.price?.unit_amount ?? 0) / 100,
        quantity: item.quantity ?? 1,
      }));

      await payload.create({
        collection: "orders",
        data: {
          restaurant: meta.restaurant as "my-restaurant" | "verde-kitchen",
          type: meta.type as "takeaway" | "eat-in",
          status: "pending",
          customer: {
            name: meta.customerName,
            phone: meta.customerPhone,
            email: meta.customerEmail || undefined,
          },
          items,
          total: (session.amount_total ?? 0) / 100,
          tableNumber: meta.tableNumber || undefined,
          notes: meta.notes || undefined,
          stripeSessionId: session.id,
        },
        overrideAccess: true,
      });
    } catch (err) {
      console.error("Failed to create order:", err);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
