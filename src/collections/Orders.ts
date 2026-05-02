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
    defaultColumns: ["id", "status", "type", "scheduledFor", "total", "createdAt"],
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
            { label: "Delivery", value: "delivery" },
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
    {
      name: "pickupTime",
      type: "text",
      label: { en: "Pickup Time", fr: "Heure de retrait", nl: "Ophaaltijd" },
      admin: {
        position: "sidebar",
        condition: (data) => data.type === "takeaway",
      },
    },
    {
      name: "delivery",
      type: "group",
      label: { en: "Delivery Address", fr: "Adresse de livraison", nl: "Bezorgadres" },
      admin: {
        condition: (data) => data.type === "delivery",
      },
      fields: [
        { name: "street", type: "text", label: { en: "Street", fr: "Rue", nl: "Straat" } },
        { name: "city", type: "text", label: { en: "City", fr: "Ville", nl: "Stad" } },
        { name: "postalCode", type: "text", label: { en: "Postal Code", fr: "Code postal", nl: "Postcode" } },
        { name: "instructions", type: "text", label: { en: "Instructions", fr: "Instructions", nl: "Instructies" } },
      ],
    },
    {
      name: "scheduledFor",
      type: "date",
      label: { en: "Scheduled For", fr: "Prévu pour", nl: "Gepland voor" },
      admin: {
        position: "sidebar",
        description: {
          en: "Leave empty for ASAP orders. Set a date/time for future orders.",
          fr: "Laisser vide pour les commandes immédiates. Définir une date/heure pour les commandes futures.",
          nl: "Leeg laten voor directe bestellingen. Stel een datum/tijd in voor toekomstige bestellingen.",
        },
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    { name: "notes", type: "textarea" },
    {
      name: "paymentMethod",
      type: "select",
      label: { en: "Payment Method", fr: "Mode de paiement", nl: "Betaalmethode" },
      options: [
        { label: "Cash", value: "cash" },
        { label: "Card", value: "card" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "stripeSessionId",
      type: "text",
      admin: { hidden: true },
    },
  ],
  timestamps: true,
};
