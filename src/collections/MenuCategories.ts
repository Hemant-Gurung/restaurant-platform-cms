import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import {
  publicRestaurantRead,
  restaurantCreate,
  restaurantUpdate,
  restaurantDelete,
  stampRestaurant,
} from "../lib/access";

export const MenuCategories: CollectionConfig = {
  slug: "menu-categories",
  access: {
    read: publicRestaurantRead,
    // Scoped admins can only create/update/delete their own restaurant's categories
    create: restaurantCreate,
    update: restaurantUpdate,
    delete: restaurantDelete,
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => stampRestaurant({ req, data }),
    ],
  },
  admin: {
    useAsTitle: "name",
    group: "Menu",
    defaultColumns: ["name", "createdAt"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        placeholder: "e.g. Starters, Mains, Desserts",
      },
    },
    {
      name: "restaurant",
      type: "select",
      required: true,
      defaultValue: "my-restaurant",
      options: RESTAURANTS,
      admin: {
        description: "Which restaurant this category belongs to",
        // Hide from scoped admins — it is auto-stamped for them via beforeChange
        condition: (_, siblingData, { user }) => {
          return !((user as Record<string, unknown>)?.restaurant);
        },
      },
    },
  ],
  timestamps: true,
};
