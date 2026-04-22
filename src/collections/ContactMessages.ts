import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
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
  labels: {
    singular: { en: "Contact Message", fr: "Message de contact", nl: "Contactbericht" },
    plural: { en: "Contact Messages", fr: "Messages de contact", nl: "Contactberichten" },
  },
  admin: {
    useAsTitle: "name",
    group: { en: "Bookings", fr: "Réservations", nl: "Boekingen" },
    defaultColumns: ["name", "restaurant", "email", "createdAt"],
  },
  fields: [
    {
      name: "restaurant",
      type: "select",
      required: true,
      options: RESTAURANTS,
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
