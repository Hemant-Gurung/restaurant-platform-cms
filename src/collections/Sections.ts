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
 * Sections — named areas of a restaurant floor plan (e.g. "Main Floor", "Patio", "Bar").
 * Each section acts as a container for Tables.
 * The frontend renders one tab per section.
 */
export const Sections: CollectionConfig = {
  slug: "sections",
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
  labels: {
    singular: { en: "Section", fr: "Section", nl: "Sectie" },
    plural: { en: "Sections", fr: "Sections", nl: "Secties" },
  },
  admin: {
    useAsTitle: "name",
    group: { en: "Floor Plan", fr: "Plan de salle", nl: "Plattegrond" },
    defaultColumns: ["name", "restaurant", "order", "isActive"],
    description: {
      en: "Named areas of your restaurant (e.g. Main Floor, Patio, Bar).",
      fr: "Zones nommées de votre restaurant (ex. Salle principale, Terrasse, Bar).",
      nl: "Benoemde zones van uw restaurant (bijv. Hoofdzaal, Terras, Bar).",
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        placeholder: "e.g. Main Floor, Patio, Bar",
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
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Display order — lower numbers appear first.",
        step: 1,
      },
    },
    {
      name: "isActive",
      label: "Active",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Uncheck to hide this section from the booking page.",
      },
    },
    {
      // Optional background image — upload your actual floor plan drawing
      name: "backgroundImage",
      label: "Floor Plan Image (optional)",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Upload a floor plan image. Tables will be positioned on top of it using percentage coordinates.",
      },
    },
    {
      // Canvas dimensions used to compute percentage positions
      name: "canvasWidth",
      label: "Canvas Width (px)",
      type: "number",
      defaultValue: 800,
      admin: {
        description:
          "The reference width used when placing tables. Positions are stored as % of this value.",
        step: 1,
      },
    },
    {
      name: "canvasHeight",
      label: "Canvas Height (px)",
      type: "number",
      defaultValue: 600,
      admin: {
        description:
          "The reference height used when placing tables. Positions are stored as % of this value.",
        step: 1,
      },
    },
  ],
  timestamps: true,
};
