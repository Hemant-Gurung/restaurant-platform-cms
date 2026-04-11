import { buildConfig, type EmailAdapter, type SharpDependency } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

import { MenuCategories } from "./collections/MenuCategories";
import { MenuItems } from "./collections/MenuItems";
import { Reservations } from "./collections/Reservations";
import { ContactMessages } from "./collections/ContactMessages";
import { Admins } from "./collections/Admins";
import { Media } from "./collections/Media";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3002",
  cors: [
    "http://localhost:3000", // my-restaurant
    "http://localhost:3001", // verde-kitchen
    process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3002",
  ],
  admin: {
    user: Admins.slug,
    meta: {
      titleSuffix: "— Restaurant Admin",
    },
  },
  collections: [
    MenuCategories,
    MenuItems,
    Media,
    Reservations,
    ContactMessages,
    Admins,
  ],
  sharp: sharp as unknown as SharpDependency,
  editor: lexicalEditor(),
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_FROM_EMAIL ?? "no-reply@example.com",
    defaultFromName: "Restaurant Admin",
    apiKey: process.env.RESEND_API_KEY ?? "",
  }) as EmailAdapter,
  secret: process.env.PAYLOAD_SECRET ?? "restaurant-payload-secret-change-me",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    push: process.env.NODE_ENV === "development",
  }),
});
