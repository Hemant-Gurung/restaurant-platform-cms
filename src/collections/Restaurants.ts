import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";

const isSuperAdmin = (user: unknown): boolean =>
  Boolean(user) && !(user as Record<string, unknown>)?.restaurant;

export const Restaurants: CollectionConfig = {
  slug: "restaurants",
  access: {
    read: ({ req }) => isSuperAdmin(req.user),
    create: ({ req }) => isSuperAdmin(req.user),
    update: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  labels: {
    singular: { en: "Restaurant", fr: "Restaurant", nl: "Restaurant" },
    plural: { en: "Restaurants", fr: "Restaurants", nl: "Restaurants" },
  },
  admin: {
    useAsTitle: "name",
    group: { en: "Settings", fr: "Paramètres", nl: "Instellingen" },
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "select",
      required: true,
      unique: true,
      options: RESTAURANTS,
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Eat In", value: "eat-in" },
        { label: "Takeaway", value: "takeaway" },
      ],
    },
    {
      name: "onlineOrdering",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Enable online ordering and Stripe payments for this restaurant",
      },
    },
    {
      name: "stripeSecretKey",
      type: "text",
      admin: {
        description: "Stripe secret key (sk_live_... or sk_test_...) from the restaurant's Stripe dashboard",
        condition: (_, siblingData) => Boolean(siblingData?.onlineOrdering),
      },
    },
    {
      name: "stripeWebhookSecret",
      type: "text",
      admin: {
        description: "Stripe webhook signing secret (whsec_...) — register webhook URL as: /api/webhooks/stripe/<slug>",
        condition: (_, siblingData) => Boolean(siblingData?.onlineOrdering),
      },
    },
  ],
  timestamps: true,
};
