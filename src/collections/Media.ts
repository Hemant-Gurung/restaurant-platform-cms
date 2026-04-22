import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import path from "path";
import { fileURLToPath } from "url";
import { publicRestaurantRead, restaurantUpdate, restaurantDelete, stampRestaurant, getRequestRestaurant } from "../lib/access";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    // Public read so frontend <img> tags work unauthenticated; scoped admin sees only own restaurant
    read: publicRestaurantRead,
    // Any authenticated user (admin or API key) can upload
    create: ({ req }) => Boolean(req.user),
    // Scoped admins can only update their own restaurant's media
    update: restaurantUpdate,
    // Scoped admins can only delete their own restaurant's media
    delete: restaurantDelete,
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        const restaurant = getRequestRestaurant(req);
        if (restaurant) {
          data.prefix = restaurant;
        }
        return stampRestaurant({ req, data });
      },
    ],
  },
  labels: {
    singular: { en: "Media", fr: "Média", nl: "Media" },
    plural: { en: "Media", fr: "Médias", nl: "Media" },
  },
  admin: {
    group: { en: "Settings", fr: "Paramètres", nl: "Instellingen" },
    defaultColumns: ["filename", "alt", "createdAt"],
  },
  upload: {
    staticDir: path.resolve(dirname, "../../public/media"),
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
        position: "centre",
      },
    ],
    adminThumbnail: ({ doc }) => doc.url as string,
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "restaurant",
      type: "select",
      required: true,
      options: RESTAURANTS,
      label: { en: "Restaurant", fr: "Restaurant", nl: "Restaurant" },
      admin: {
        position: "sidebar",
        description: {
          en: "Auto-populated on upload",
          fr: "Rempli automatiquement lors du téléchargement",
          nl: "Automatisch ingevuld bij upload",
        },
        condition: (_, __, { user }) => !((user as Record<string, unknown>)?.restaurant),
      },
    },
    {
      name: "alt",
      type: "text",
      required: true,
      label: { en: "Alt Text", fr: "Texte alternatif", nl: "Alt-tekst" },
    },
  ],
};
