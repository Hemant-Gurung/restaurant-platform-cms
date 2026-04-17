import type { CollectionConfig } from "payload";
import { privateRestaurantRead, stampRestaurant } from "../lib/access";

export const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    create: () => true,
    read: privateRestaurantRead,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: "Bookings",
    defaultColumns: ["id", "status", "type", "total", "createdAt"],
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => stampRestaurant({ req, data }),
    ],
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
        readOnly: true,
        description: "Auto-populated from the app's API key",
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
        { name: "price", type: "number", required: true },
        { name: "quantity", type: "number", required: true },
      ],
    },
    {
      name: "total",
      type: "number",
      required: true,
      admin: { readOnly: true },
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
  ],
  timestamps: true,
};
