import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPayload } from "payload";
import config from "@payload-config";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildOrderEmail({
  restaurantName,
  customerName,
  type,
  tableNumber,
  items,
  total,
  notes,
}: {
  restaurantName: string;
  customerName: string;
  type: string;
  tableNumber?: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  notes?: string;
}) {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;color:#374151;font-size:14px;">${item.name}</td>
        <td style="padding:6px 0;color:#374151;font-size:14px;text-align:center;">×${item.quantity}</td>
        <td style="padding:6px 0;color:#374151;font-size:14px;text-align:right;">€${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const typeLabel = type === "eat-in" ? `Eat In${tableNumber ? ` — Table ${tableNumber}` : ""}` : "Takeaway";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111827;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${restaurantName}</h1>
      <p style="margin:6px 0 0;color:#9ca3af;font-size:14px;">Order Confirmation</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#111827;">Hi <strong>${customerName}</strong>, your order has been received!</p>

      <div style="background:#f3f4f6;border-radius:6px;padding:10px 14px;margin-bottom:20px;font-size:13px;color:#6b7280;">
        <strong style="color:#111827;">${typeLabel}</strong>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="border-bottom:1px solid #e5e7eb;">
            <th style="padding:6px 0;text-align:left;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Item</th>
            <th style="padding:6px 0;text-align:center;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Qty</th>
            <th style="padding:6px 0;text-align:right;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr style="border-top:1px solid #e5e7eb;">
            <td colspan="2" style="padding:10px 0;font-size:14px;font-weight:700;color:#111827;">Total</td>
            <td style="padding:10px 0;font-size:16px;font-weight:700;color:#111827;text-align:right;">€${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${notes ? `<p style="font-size:13px;color:#6b7280;background:#f9fafb;padding:10px 14px;border-radius:6px;margin:0 0 20px;"><strong>Note:</strong> ${notes}</p>` : ""}

      <p style="font-size:13px;color:#6b7280;margin:0;">We'll prepare your order shortly. Thank you!</p>
    </div>
  </div>
</body>
</html>`;
}

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
    | { name?: string; stripeSecretKey?: string; stripeWebhookSecret?: string }
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

      const total = (session.amount_total ?? 0) / 100;

      await payload.create({
        collection: "orders",
        data: {
          restaurant: meta.restaurant as "my-restaurant" | "verde-kitchen",
          type: meta.type as "takeaway" | "eat-in" | "delivery",
          status: "pending",
          customer: {
            name: meta.customerName,
            phone: meta.customerPhone,
            email: meta.customerEmail || undefined,
          },
          items,
          total,
          tableNumber: meta.tableNumber || undefined,
          pickupTime: meta.pickupTime || undefined,
          delivery: meta.type === "delivery" ? {
            street: meta.deliveryStreet || undefined,
            city: meta.deliveryCity || undefined,
            postalCode: meta.deliveryPostalCode || undefined,
            instructions: meta.deliveryInstructions || undefined,
          } : undefined,
          scheduledFor: meta.scheduledFor || undefined,
          notes: meta.notes || undefined,
          stripeSessionId: session.id,
        },
        overrideAccess: true,
      });

      if (meta.customerEmail && isValidEmail(meta.customerEmail)) {
        const restaurantName = restaurantDoc.name ?? restaurantSlug;
        await payload.sendEmail({
          to: meta.customerEmail,
          subject: `Order Confirmation — ${restaurantName}`,
          html: buildOrderEmail({
            restaurantName,
            customerName: meta.customerName,
            type: meta.type,
            tableNumber: meta.tableNumber || undefined,
            items,
            total,
            notes: meta.notes || undefined,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to create order:", err);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
