import type { CollectionConfig } from "payload";
import {
  publicRestaurantRead,
  restaurantCreate,
  restaurantUpdate,
  restaurantDelete,
  stampRestaurant,
  getRequestRestaurant,
} from "../lib/access";

export const MenuItems: CollectionConfig = {
  slug: "menu-items",
  access: {
    read: publicRestaurantRead,
    // Scoped admins can only create/update/delete their own restaurant's items
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
    defaultColumns: ["name", "restaurant", "category", "price", "available"],
    components: {
      beforeListTable: ["@/components/MenuItemCategoryFilter"],
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
      admin: {
        step: 0.01,
        placeholder: "0.00",
      },
    },
    {
      name: "restaurant",
      type: "select",
      required: true,
      defaultValue: "my-restaurant",
      options: [
        { label: "My Restaurant", value: "my-restaurant" },
        { label: "Verde Kitchen", value: "verde-kitchen" },
      ],
      admin: {
        position: "sidebar",
        description: "Which restaurant this item belongs to",
        // Hide from scoped admins — it is auto-stamped for them via beforeChange
        condition: (_, siblingData, { user }) => {
          return !((user as Record<string, unknown>)?.restaurant);
        },
      },
    },
    {
      name: "available",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Uncheck to hide this item from the menu",
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "menu-categories",
      required: true,
      // Only show categories that belong to the same restaurant as the current user
      filterOptions: ({ user }) => {
        const restaurant = (user as Record<string, unknown>)?.restaurant;
        if (restaurant) {
          return { restaurant: { equals: restaurant } };
        }
        return true;
      },
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
        description: "Optional dish photo",
      },
    },
  ],
  timestamps: true,
};
