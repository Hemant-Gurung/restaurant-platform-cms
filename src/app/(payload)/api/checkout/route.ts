import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(req: NextRequest) {
  try {
    const { restaurant, type, customer, items, tableNumber, notes, successUrl, cancelUrl } =
      await req.json();

    if (!restaurant || !type || !customer?.name || !customer?.phone || !items?.length || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "restaurants",
      where: { slug: { equals: restaurant } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    const restaurantDoc = result.docs[0] as
      | { onlineOrdering?: boolean; stripeSecretKey?: string }
      | undefined;

    if (!restaurantDoc?.onlineOrdering) {
      return NextResponse.json({ error: "Online ordering is not available for this restaurant" }, { status: 403 });
    }
    if (!restaurantDoc.stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured for this restaurant" }, { status: 503 });
    }

    const stripe = new Stripe(restaurantDoc.stripeSecretKey);

    const lineItems = items.map((item: { name: string; price: number; quantity: number }) => ({
      price_data: {
        currency: process.env.STRIPE_CURRENCY ?? "gbp",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customer.email,
      metadata: {
        restaurant,
        type,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email ?? "",
        tableNumber: tableNumber ?? "",
        notes: notes ?? "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
