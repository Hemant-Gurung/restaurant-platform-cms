import type { CollectionConfig } from "payload";
import { privateRestaurantRead, restaurantCreate, getRequestRestaurant } from "../lib/access";

const RESTAURANT_LABELS: Record<string, string> = {
  "my-restaurant": "My Restaurant",
  "verde-kitchen": "Verde Kitchen",
};

export const Reservations: CollectionConfig = {
  slug: "reservations",
  access: {
    // Only accessible to authenticated users; API key users see only their restaurant's bookings
    read: privateRestaurantRead,
    // App API key users and admins can create reservations
    create: restaurantCreate,
    // Only admins can update/delete
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === "create" && data?.date) {
          const reservationDate = new Date(data.date as string);
          const now = new Date();
          if (reservationDate < now) {
            throw new Error("Reservation date must be in the future.");
          }
          // No reservations more than 90 days out
          const maxDate = new Date();
          maxDate.setDate(maxDate.getDate() + 90);
          if (reservationDate > maxDate) {
            throw new Error("Reservations can only be made up to 90 days in advance.");
          }
        }
        return data;
      },
      async ({ data, operation, req }) => {
        // Validate that the party size does not exceed the selected table's capacity
        if (operation === "create" && data?.table && data?.partySize) {
          const table = await req.payload.findByID({
            collection: "tables",
            id: data.table as string,
            depth: 0,
          });
          if (table && (data.partySize as number) > (table.capacity as number)) {
            throw new Error(
              `Party size (${data.partySize}) exceeds the capacity of the selected table (${table.capacity}).`
            );
          }
        }
        return data;
      },
    ],
    beforeChange: [
      ({ req, data }) => {
        // Auto-stamp the restaurant from the API key so apps never need to send it explicitly
        const restaurant = getRequestRestaurant(req);
        if (restaurant) {
          data.restaurant = restaurant;
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Send confirmation email when a new reservation is created
        if (operation === "create" && doc.email) {
          try {
            const restaurantName = RESTAURANT_LABELS[doc.restaurant as string] ?? doc.restaurant;
            const reservationDate = new Date(doc.date as string).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            await req.payload.sendEmail({
              to: doc.email as string,
              subject: `Reservation Request Received — ${restaurantName}`,
              html: `
                <h2>Thanks for your reservation request, ${doc.name}!</h2>
                <p>We've received your booking and will confirm it shortly.</p>
                <table style="border-collapse:collapse;margin-top:16px;">
                  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Restaurant</td><td>${restaurantName}</td></tr>
                  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Date & Time</td><td>${reservationDate}</td></tr>
                  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Party Size</td><td>${doc.partySize}</td></tr>
                  ${doc.type === "table" && doc.table ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Table</td><td>${typeof doc.table === "object" ? (doc.table as { label?: string }).label ?? "Selected table" : "Selected table"}</td></tr>` : ""}
                  ${doc.notes ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Notes</td><td>${doc.notes}</td></tr>` : ""}
                </table>
                <p style="margin-top:16px;color:#666;">If you need to make changes, please contact us directly.</p>
              `,
            });
          } catch (err) {
            // Log but don't fail the request — email is best-effort
            req.payload.logger.error({ err }, "Failed to send reservation confirmation email");
          }
        }
      },
    ],
  },
  admin: {
    useAsTitle: "name",
    group: "Bookings",
    defaultColumns: ["name", "restaurant", "date", "partySize", "type", "status"],
  },
  fields: [
    {
      name: "restaurant",
      type: "select",
      required: true,
      options: [
        { label: "My Restaurant", value: "my-restaurant" },
        { label: "Verde Kitchen", value: "verde-kitchen" },
      ],
      admin: {
        position: "sidebar",
        description: "Auto-populated from the app's API key",
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
    },
    {
      name: "date",
      type: "date",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "partySize",
      label: "Party Size",
      type: "number",
      required: true,
      min: 1,
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "general",
      options: [
        { label: "General", value: "general" },
        { label: "Table", value: "table" },
      ],
      admin: {
        position: "sidebar",
        description: "General = name/time only. Table = specific floor plan table selected.",
      },
    },
    {
      name: "table",
      type: "relationship",
      relationTo: "tables",
      required: false,
      filterOptions: ({ siblingData }) => {
        const restaurant = (siblingData as Record<string, unknown>)?.restaurant;
        if (restaurant) return { restaurant: { equals: restaurant } };
        return true;
      },
      admin: {
        position: "sidebar",
        description: "The specific table the guest selected on the floor plan.",
        condition: (_, siblingData) => siblingData?.type === "table",
      },
    },
    {
      name: "notes",
      type: "textarea",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "PENDING",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Confirmed", value: "CONFIRMED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
      admin: {
        position: "sidebar",
      },
    },
  ],
  timestamps: true,
};
