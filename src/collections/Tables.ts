import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import {
  publicRestaurantRead,
  restaurantCreate,
  restaurantUpdate,
  restaurantDelete,
  stampRestaurant,
} from "../lib/access";

/**
 * Tables — individual tables within a Section.
 *
 * Position & size are stored as PERCENTAGES of the section's canvas dimensions.
 * This makes the floor plan resolution-independent — it scales to any screen size.
 *
 * Example: x=25, y=40 means the table centre sits at 25% from left, 40% from top.
 */
export const Tables: CollectionConfig = {
  slug: "tables",
  access: {
    read: publicRestaurantRead,
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
    useAsTitle: "label",
    group: "Floor Plan",
    defaultColumns: ["label", "section", "capacity", "shape", "isActive", "restaurant"],
    description: "Individual tables. Position them using percentage coordinates on the floor plan.",
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      admin: {
        placeholder: "e.g. T1, Window Table, Bar Seat 3",
        description: "Shown to customers when they hover or select the table.",
      },
    },
    {
      name: "restaurant",
      type: "select",
      required: true,
      defaultValue: "my-restaurant",
      options: RESTAURANTS,
      admin: {
        position: "sidebar",
        condition: (_, _siblingData, { user }) =>
          !((user as Record<string, unknown>)?.restaurant),
      },
    },
    {
      name: "section",
      type: "relationship",
      relationTo: "sections",
      required: true,
      filterOptions: ({ user }) => {
        const restaurant = (user as Record<string, unknown>)?.restaurant;
        if (restaurant) return { restaurant: { equals: restaurant } };
        return true;
      },
      admin: {
        position: "sidebar",
        description: "Which section/area this table belongs to.",
      },
    },
    {
      name: "capacity",
      type: "number",
      required: true,
      min: 1,
      max: 30,
      admin: {
        description: "Maximum number of guests this table seats.",
        step: 1,
      },
    },
    {
      name: "shape",
      type: "select",
      required: true,
      defaultValue: "round",
      options: [
        { label: "Round", value: "round" },
        { label: "Square", value: "square" },
        { label: "Rectangle", value: "rectangle" },
      ],
      admin: {
        position: "sidebar",
        description: "Visual shape shown on the floor plan.",
      },
    },
    // ── Position & size (% of canvas) ──────────────────────────────────────
    {
      name: "x",
      label: "X Position (%)",
      type: "number",
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: "Horizontal centre of the table as % of canvas width (0 = left, 100 = right).",
        step: 0.5,
      },
    },
    {
      name: "y",
      label: "Y Position (%)",
      type: "number",
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: "Vertical centre of the table as % of canvas height (0 = top, 100 = bottom).",
        step: 0.5,
      },
    },
    {
      name: "width",
      label: "Width (%)",
      type: "number",
      required: true,
      defaultValue: 8,
      min: 1,
      max: 50,
      admin: {
        description: "Table width as % of canvas width.",
        step: 0.5,
      },
    },
    {
      name: "height",
      label: "Height (%)",
      type: "number",
      required: true,
      defaultValue: 8,
      min: 1,
      max: 50,
      admin: {
        description: "Table height as % of canvas height. For round/square tables, keep equal to width.",
        step: 0.5,
      },
    },
    // ── Status ─────────────────────────────────────────────────────────────
    {
      name: "isActive",
      label: "Active",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Uncheck to mark this table as unavailable (shown greyed out on the floor plan).",
      },
    },
  ],
  timestamps: true,
};
