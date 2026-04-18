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
  admin: {
    useAsTitle: "name",
    group: "Settings",
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
  ],
  timestamps: true,
};
