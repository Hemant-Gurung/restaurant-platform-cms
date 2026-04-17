import { buildConfig, type EmailAdapter, type SharpDependency } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
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
import { Sections } from "./collections/Sections";
import { Tables } from "./collections/Tables";
import { availabilityHandler } from "./lib/availabilityEndpoint";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const devOrigins =
  process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    : [];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3002";

export default buildConfig({
  serverURL,
  cors: [...devOrigins, ...allowedOrigins, serverURL],
  // csrf must include every origin that sends cookie-authenticated POST requests.
  // Payload only adds serverURL automatically — add dev localhost explicitly so
  // admin panel POST requests (preferences, etc.) work when NEXT_PUBLIC_SERVER_URL
  // points to a production domain.
  csrf: [...devOrigins, ...allowedOrigins, serverURL],
  admin: {
    user: Admins.slug,
    meta: {
      titleSuffix: "— Restaurant Admin",
    },
    components: {
      afterNavLinks: ["@/views/FloorPlanView/NavLink#default"],
      views: {
        floorPlan: {
          Component: "@/views/FloorPlanView#default",
          path: "/floor-plan",
          exact: true,
        },
      },
    },
  },
  endpoints: [
    {
      // GET /api/availability?restaurant=my-restaurant&date=2026-04-15&time=7:00 PM
      // Returns { reservedTableIds: string[] } for the given slot (±2 hr window)
      path: "/availability",
      method: "get",
      handler: availabilityHandler,
    },
  ],
  collections: [
    MenuCategories,
    MenuItems,
    Media,
    Sections,
    Tables,
    Reservations,
    ContactMessages,
    Admins,
  ],
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN ?? "",
      collections: {
        media: true,
      },
    }),
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
      max: process.env.NODE_ENV === "production" ? 1 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    },
    push: process.env.PAYLOAD_PUSH === "true",
  }),
});
