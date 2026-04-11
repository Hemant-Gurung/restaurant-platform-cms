import type { CollectionConfig } from "payload";
import { privateRestaurantRead, restaurantCreate, getRequestRestaurant } from "../lib/access";

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
    defaultColumns: ["name", "restaurant", "date", "partySize", "status"],
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
