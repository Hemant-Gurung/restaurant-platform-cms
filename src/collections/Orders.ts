import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import { privateRestaurantRead, stampRestaurant } from "../lib/access";

export const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    create: ({ req }) => !((req.user as unknown as Record<string, unknown>)?.restaurant),
    read: privateRestaurantRead,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  labels: {
    singular: { en: "Order", fr: "Commande", nl: "Bestelling" },
    plural: { en: "Orders", fr: "Commandes", nl: "Bestellingen" },
  },
  admin: {
    group: { en: "Bookings", fr: "Réservations", nl: "Boekingen" },
    defaultColumns: ["id", "status", "type", "total", "createdAt"],
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => stampRestaurant({ req, data }),
      ({ data }) => {
        const items = data.items as { price?: number; quantity?: number }[] | undefined;
        if (Array.isArray(items) && items.length > 0) {
          data.total = items.reduce(
            (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
            0,
          );
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "restaurant",
      type: "select",
      required: true,
      options: RESTAURANTS,
      admin: {
        position: "sidebar",
        condition: (_, __, { user }) => {
          return !((user as unknown as Record<string, unknown>)?.restaurant);
        },
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          options: [
            { label: "Takeaway", value: "takeaway" },
            { label: "Eat In", value: "eat-in" },
          ],
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "pending",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Preparing", value: "preparing" },
            { label: "Ready", value: "ready" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
          admin: {
            position: "sidebar",
          },
        },
      ],
    },
    {
      name: "customer",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "phone", type: "text", required: true },
        { name: "email", type: "email" },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "price", type: "number", required: true, admin: { step: 0.01 } },
        { name: "quantity", type: "number", required: true, min: 1 },
      ],
    },
    {
      name: "total",
      type: "number",
      required: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: {
          en: "Auto-calculated from items",
          fr: "Calculé automatiquement depuis les articles",
          nl: "Automatisch berekend vanuit items",
        },
        step: 0.01,
      },
    },
    {
      name: "tableNumber",
      type: "text",
      admin: {
        position: "sidebar",
        condition: (data) => data.type === "eat-in",
      },
    },
    { name: "notes", type: "textarea" },
    {
      name: "stripeSessionId",
      type: "text",
      admin: { hidden: true },
    },
  ],
  timestamps: true,
};
