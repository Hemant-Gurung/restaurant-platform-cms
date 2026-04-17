import type { CollectionConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";
import { publicRestaurantRead, restaurantUpdate, restaurantDelete, stampRestaurant } from "../lib/access";

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
    beforeChange: [({ req, data }) => stampRestaurant({ req, data })],
  },
  admin: {
    group: "Settings",
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
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
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
        description: "Auto-populated on upload",
      },
    },
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
