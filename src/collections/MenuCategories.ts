import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import {
  publicRestaurantRead,
  restaurantCreate,
  restaurantUpdate,
  restaurantDelete,
  stampRestaurant,
} from "../lib/access";
import { autoTranslate } from "../lib/autoTranslate";

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
    afterChange: [
      ({ doc, req }) => {
        const locale = (req as unknown as { locale?: string }).locale;
        if (!locale || locale === "en") {
          setTimeout(() => {
            autoTranslate({
              payload: req.payload,
              collection: "menu-categories",
              id: String(doc.id),
              fields: ["name"],
              sourceData: doc as Record<string, unknown>,
            }).catch((err) => console.error("Menu category auto-translate failed:", err));
          }, 3000);
        }
        return doc;
      },
    ],
  },
  labels: {
    singular: { en: "Menu Category", fr: "Catégorie du menu", nl: "Menucategorie" },
    plural: { en: "Menu Categories", fr: "Catégories du menu", nl: "Menucategorieën" },
  },
  admin: {
    useAsTitle: "name",
    group: { en: "Menu", fr: "Menu", nl: "Menu" },
    defaultColumns: ["name", "createdAt"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      localized: true,
      label: { en: "Name", fr: "Nom", nl: "Naam" },
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
      label: { en: "Restaurant", fr: "Restaurant", nl: "Restaurant" },
      admin: {
        description: {
          en: "Which restaurant this category belongs to",
          fr: "À quel restaurant appartient cette catégorie",
          nl: "Bij welk restaurant deze categorie hoort",
        },
        // Hide from scoped admins — it is auto-stamped for them via beforeChange
        condition: (_, siblingData, { user }) => {
          return !((user as Record<string, unknown>)?.restaurant);
        },
      },
    },
  ],
  timestamps: true,
};
