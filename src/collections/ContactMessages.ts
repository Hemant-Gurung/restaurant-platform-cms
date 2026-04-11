import type { CollectionConfig } from "payload";
import { privateRestaurantRead, restaurantCreate, getRequestRestaurant } from "../lib/access";

export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  access: {
    // Only accessible to authenticated users; API key users see only their restaurant's messages
    read: privateRestaurantRead,
    // App API key users and admins can create messages
    create: restaurantCreate,
    // Read-only — no updates or deletes
    update: () => false,
    delete: () => false,
  },
  hooks: {
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
  },
  admin: {
    useAsTitle: "name",
    group: "Bookings",
    defaultColumns: ["name", "restaurant", "email", "createdAt"],
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
      name: "message",
      type: "textarea",
      required: true,
    },
  ],
  timestamps: true,
};
