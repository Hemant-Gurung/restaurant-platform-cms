import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import {
  publicRestaurantRead,
  restaurantCreate,
  restaurantUpdate,
  restaurantDelete,
  stampRestaurant,
} from "../lib/access";

export const MenuItems: CollectionConfig = {
  slug: "menu-items",
  labels: {
    singular: { en: "Menu Item", fr: "Article du menu", nl: "Menu-item" },
    plural: { en: "Menu Items", fr: "Articles du menu", nl: "Menu-items" },
  },
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
    useAsTitle: "name",
    group: { en: "Menu", fr: "Menu", nl: "Menu" },
    defaultColumns: ["name", "category", "price", "available"],
    components: {
      beforeListTable: ["@/components/MenuItemCategoryFilter"],
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: { en: "Name", fr: "Nom", nl: "Naam" },
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      label: { en: "Description", fr: "Description", nl: "Beschrijving" },
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
      label: { en: "Price", fr: "Prix", nl: "Prijs" },
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
      options: RESTAURANTS,
      label: { en: "Restaurant", fr: "Restaurant", nl: "Restaurant" },
      admin: {
        position: "sidebar",
        description: {
          en: "Which restaurant this item belongs to",
          fr: "À quel restaurant appartient cet article",
          nl: "Bij welk restaurant dit item hoort",
        },
        condition: (_, siblingData, { user }) => {
          return !((user as Record<string, unknown>)?.restaurant);
        },
      },
    },
    {
      name: "available",
      type: "checkbox",
      defaultValue: true,
      label: { en: "Available", fr: "Disponible", nl: "Beschikbaar" },
      admin: {
        description: {
          en: "Uncheck to hide this item from the menu",
          fr: "Décochez pour masquer cet article du menu",
          nl: "Uitvinken om dit item te verbergen in het menu",
        },
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "menu-categories",
      required: true,
      label: { en: "Category", fr: "Catégorie", nl: "Categorie" },
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
      label: { en: "Image", fr: "Image", nl: "Afbeelding" },
      admin: {
        position: "sidebar",
        description: {
          en: "Optional dish photo",
          fr: "Photo du plat (optionnel)",
          nl: "Optionele gerechfoto",
        },
      },
    },
  ],
  timestamps: true,
};
