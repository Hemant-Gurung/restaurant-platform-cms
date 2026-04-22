import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import path from "path";
import { fileURLToPath } from "url";
import { publicRestaurantRead, restaurantUpdate, restaurantDelete, stampRestaurant, getRequestRestaurant } from "../lib/access";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Videos: CollectionConfig = {
  slug: "videos",
  access: {
    read: publicRestaurantRead,
    create: ({ req }) => Boolean(req.user),
    update: restaurantUpdate,
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
    singular: { en: "Video", fr: "Vidéo", nl: "Video" },
    plural: { en: "Videos", fr: "Vidéos", nl: "Video's" },
  },
  admin: {
    group: { en: "Settings", fr: "Paramètres", nl: "Instellingen" },
    defaultColumns: ["filename", "createdAt"],
  },
  upload: {
    staticDir: path.resolve(dirname, "../../public/videos"),
    mimeTypes: ["video/*"],
  },
  fields: [
    {
      name: "restaurant",
      type: "select",
      required: true,
      options: RESTAURANTS,
      admin: {
        position: "sidebar",
        condition: (_, __, { user }) => !((user as Record<string, unknown>)?.restaurant),
      },
    },
  ],
  timestamps: true,
};
