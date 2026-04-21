import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import { publicRestaurantRead, restaurantCreate, restaurantUpdate, stampRestaurant } from "../lib/access";

export const SiteContent: CollectionConfig = {
  slug: "site-content",
  access: {
    read: publicRestaurantRead,
    create: restaurantCreate,
    update: restaurantUpdate,
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => stampRestaurant({ req, data }),
    ],
  },
  admin: {
    useAsTitle: "restaurant",
    group: "Settings",
    defaultColumns: ["restaurant", "updatedAt"],
  },
  fields: [
    {
      name: "restaurant",
      type: "select",
      required: true,
      options: RESTAURANTS,
      admin: {
        position: "sidebar",
        condition: (_, siblingData, { user }) => {
          return !((user as Record<string, unknown>)?.restaurant);
        },
      },
    },
    // — Identity —
    {
      name: "tagline",
      type: "text",
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
      admin: {
        description: "Short description shown in hero or meta tags",
      },
    },
    {
      name: "story",
      type: "richText",
      localized: true,
      admin: {
        description: "About / our story section",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
        description: "Shown as fallback when no video is set",
      },
    },
    {
      name: "heroVideo",
      type: "upload",
      relationTo: "videos",
      admin: {
        position: "sidebar",
        description: "Optional background video for the hero section (MP4 recommended)",
      },
    },
    // — Contact —
    {
      name: "contact",
      type: "group",
      fields: [
        { name: "phone", type: "text" },
        { name: "email", type: "email" },
        { name: "address", type: "textarea" },
      ],
    },
    // — Opening hours —
    {
      name: "openingHours",
      type: "array",
      fields: [
        {
          name: "day",
          type: "select",
          required: true,
          options: [
            { label: "Monday", value: "monday" },
            { label: "Tuesday", value: "tuesday" },
            { label: "Wednesday", value: "wednesday" },
            { label: "Thursday", value: "thursday" },
            { label: "Friday", value: "friday" },
            { label: "Saturday", value: "saturday" },
            { label: "Sunday", value: "sunday" },
          ],
        },
        { name: "open", type: "text", admin: { placeholder: "12:00" } },
        { name: "close", type: "text", admin: { placeholder: "22:00" } },
        { name: "closed", type: "checkbox", defaultValue: false },
      ],
    },
    // — Social links —
    {
      name: "socialLinks",
      type: "array",
      fields: [
        {
          name: "platform",
          type: "select",
          required: true,
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "Facebook", value: "facebook" },
            { label: "TikTok", value: "tiktok" },
            { label: "X / Twitter", value: "twitter" },
          ],
        },
        { name: "url", type: "text", required: true },
      ],
    },
  ],
  timestamps: true,
};
