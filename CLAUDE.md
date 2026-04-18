# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server on port 3002
pnpm build            # Production build
pnpm start            # Start production server on port 3002

# Payload CMS
pnpm generate:types   # Regenerate src/payload-types.ts from collection definitions
pnpm migrate:create   # Create a new migration file
pnpm migrate          # Run pending migrations (uses PAYLOAD_CONFIG_PATH env var)
```

No test or lint scripts are configured.

## Architecture

This is a **Payload CMS v3 + Next.js App Router** project serving as a headless CMS backend for a multi-restaurant platform.

### Multi-tenancy

The central design pattern is restaurant-scoping. Every collection has a `restaurant` field (a select enum, not a relationship). Access control and data isolation are enforced via helpers in [src/lib/access.ts](src/lib/access.ts):

- `stampRestaurant()` — a `beforeChange` hook that auto-populates the `restaurant` field from the authenticated admin's restaurant
- `publicRestaurantRead()` / `privateRestaurantRead()` — filter queries by restaurant slug from the request
- `getRequestRestaurant()` — extracts the restaurant slug from the authenticated user's token

All collections attach `stampRestaurant` as a `beforeChange` hook, so the restaurant is always stamped server-side rather than trusted from the client.

The `restaurant` field uses `admin.condition` to hide it from scoped admins in the UI (they only have one restaurant; it is auto-stamped). Super-admins see and can set the field manually.

### Payload Config

[src/payload.config.ts](src/payload.config.ts) is the single source of truth. Key settings:

- **Database**: PostgreSQL via `DATABASE_URL`; `push: true` in development (schema auto-syncs without migrations)
- **Email**: Resend adapter, configured via `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- **CORS/CSRF**: Both explicitly set to `[...devOrigins, ...allowedOrigins, serverURL]` where `devOrigins` includes `localhost:3000/3001/3002` in development. This is required — Payload only auto-adds `serverURL` to CSRF, so localhost POST requests fail if `NEXT_PUBLIC_SERVER_URL` points to a production domain.
- **Media**: Uploads stored via Vercel Blob (`BLOB_READ_WRITE_TOKEN`). Configured with `prefix: ""` so the plugin tracks a per-document `prefix` field in the DB. Generates a 400×300 thumbnail.
- **Custom view**: Floor Plan editor registered under `admin.components.views.floorPlan`

### Collections

| Collection       | Slug               | Access                                      |
| ---------------- | ------------------ | ------------------------------------------- |
| Admins           | `admins`           | Auth + API key; optional restaurant scope   |
| MenuCategories   | `menu-categories`  | Public read (restaurant-scoped)             |
| MenuItems        | `menu-items`       | Public read (restaurant-scoped)             |
| Media            | `media`            | Public read (restaurant-scoped); auth write |
| Sections         | `sections`         | Public read (restaurant-scoped); auth write |
| Tables           | `tables`           | Public read (restaurant-scoped); auth write |
| Reservations     | `reservations`     | Authenticated read; no deletes              |
| ContactMessages  | `contact-messages` | Authenticated read; no updates/deletes      |

`Admins` without a restaurant set are treated as super-admins with access to all restaurants.

### Media Collection

`src/collections/Media.ts` — restaurant-scoped image uploads via Vercel Blob.

**Vercel Blob folder structure:**

Files are stored as `<restaurant-slug>/<filename>` (e.g. `my-restaurant/momo.jpg`). This is achieved via two cooperating pieces:

1. `vercelBlobStorage` is configured with `media: { prefix: "" }` — this enables the plugin's per-document `prefix` field in the DB.
2. The `beforeChange` hook sets `data.prefix = restaurant` (the scoped user's restaurant slug) before the document is saved. The plugin's `afterChange` hook then reads `doc.prefix` to construct the Vercel Blob path.

Super-admins (no restaurant on their token) upload without a prefix (root of the blob store).

The Payload static handler URL (`/api/media/file/<filename>`) does **not** contain the prefix — the handler looks up `doc.prefix` from the DB at serve time to reconstruct the full blob path. Existing files uploaded without a prefix continue to work.

**Why `/` in `req.file.name` does not work:** Payload sanitizes filenames before storage, stripping `/`. The plugin's `prefix` field is the only correct mechanism for creating Vercel Blob folder paths.

### Floor Plan Collections

**Sections** (`src/collections/Sections.ts`) — named areas (e.g. Main Floor, Patio, Bar). Fields:

- `name`, `restaurant`, `order` (display order), `isActive`
- `backgroundImage` — optional upload (floor plan image drawn behind tables)
- `canvasWidth` / `canvasHeight` — reference dimensions in px (default 800×600); table positions are stored as percentages of these values

**Tables** (`src/collections/Tables.ts`) — individual tables within a Section. Fields:

- `label`, `restaurant`, `section` (relationship to sections), `capacity`, `shape` (round/square/rectangle)
- `x`, `y` — centre position as % of canvas (0–100)
- `width`, `height` — size as % of canvas (default 8%)
- `isActive`

Position/size are stored as percentages so the floor plan is resolution-independent.

### Floor Plan Editor (Custom Admin View)

A drag-and-drop visual editor is available at `/admin/floor-plan`. It is a `'use client'` React component registered as a custom Payload admin view.

**Files:**

- [src/views/FloorPlanView/index.tsx](src/views/FloorPlanView/index.tsx) — main canvas component
- [src/views/FloorPlanView/NavLink.tsx](src/views/FloorPlanView/NavLink.tsx) — sidebar nav link

**Behaviour:**

- Fetches `/api/sections` and `/api/tables` with `credentials: 'include'`
- Section tabs switch between floor areas
- Tables rendered as chips at `left: x%, top: y%` with `transform: translate(-50%, -50%)`
- Drag detection: >4px mouse movement = drag; otherwise click navigates to `/admin/collections/tables/:id`
- On drag end: PATCH `/api/tables/:id` with `{ x, y }` (rounded to 1 decimal)
- Chip colours: blue = active, gray = inactive, amber = saving

**Registration in payload.config.ts:**

```ts
admin.components.views.floorPlan = {
  Component: "@/views/FloorPlanView#default",
  path: "/floor-plan",
  exact: true,
}
admin.components.afterNavLinks = ["@/views/FloorPlanView/NavLink#default"]
```

After changing any component registered here, **restart `pnpm dev`** so Payload auto-regenerates `src/app/(payload)/admin/importMap.js`.

### Custom API Endpoints

**`GET /api/availability`** — Returns `{ reservedTableIds: string[] }` for a given restaurant/date/time slot (+/-2 hr window).

Handler: [src/lib/availabilityEndpoint.ts](src/lib/availabilityEndpoint.ts)

### Rate Limiting Middleware

[src/middleware.ts](src/middleware.ts) applies in-memory rate limiting on public-facing write endpoints:

- `POST /api/reservations` — 10 requests per 60s per IP
- `POST /api/contact-messages` — 5 requests per 60s per IP

The matcher is narrowed to only these two paths so Payload internal routes (e.g. `/api/payload-preferences/*`) are never intercepted.

### webpack Module Resolution

[next.config.ts](next.config.ts) adds `config.resolve.extensionAlias` so webpack resolves `.js` imports to `.ts`/`.tsx`:

```ts
config.resolve.extensionAlias = {
  ".js": [".ts", ".tsx", ".js"],
  ".jsx": [".tsx", ".jsx"],
}
```

This is required because Payload internals use `.js` extensions in their imports.

### Routing

```text
/                          → redirects to /admin
/admin/[[...segments]]     → Payload admin panel
/admin/floor-plan          → Custom floor plan editor
/api/[[...slug]]           → Payload REST API
/api/availability          → Custom availability endpoint
```

The `(payload)` route group in [src/app/(payload)/](src/app/(payload)/) wires Payload into Next.js using `withPayload()` in [next.config.ts](next.config.ts).

### Path Aliases

```text
@/*             → src/*
@payload-config → src/payload.config.ts
```

### Frontend Integration

#### API Key Authentication

API keys live on the `admins` collection (slug = `admins`). Payload's API key header format is `{collectionSlug} API-Key {key}`, so the correct header is:

```http
Authorization: admins API-Key <your-api-key>
```

**Not** `users API-Key` — that is wrong and will return 401.

Create the API key in `/admin/collections/admins` → enable API Key → set the `restaurant` field to the restaurant slug. The restaurant is then auto-stamped on every reservation created with that key.

#### Frontend env vars

```env
NEXT_PUBLIC_CMS_URL=http://localhost:3002    # CMS base URL
CMS_API_KEY=<key from admin>                 # Server-side only — never expose to browser
NEXT_PUBLIC_RESTAURANT=my-restaurant         # Restaurant slug
```

#### Public endpoints (no auth needed)

```text
GET /api/sections?restaurant=<slug>&sort=order
GET /api/tables?restaurant=<slug>&limit=500
GET /api/menu-categories?restaurant=<slug>&sort=order
GET /api/menu-items?restaurant=<slug>&sort=order&limit=200
GET /api/availability?restaurant=<slug>&date=YYYY-MM-DD&time=7:00 PM
```

#### Protected endpoint (requires API key — proxy server-side)

```ts
// Next.js API route: app/api/book/route.ts
fetch(`${CMS_URL}/api/reservations`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `admins API-Key ${process.env.CMS_API_KEY}`,
  },
  body: JSON.stringify({
    type: 'general' | 'table',
    name, email, phone,
    date,      // full ISO datetime: "2026-04-15T19:00:00.000Z"
    partySize,
    table,     // table document ID — only for type: 'table'
    notes,     // optional
  }),
})
```

Reservation types:

- `general` — name/email/phone/date/partySize only, no table field
- `table` — same + `table: "<tableId>"` from the floor plan

The CMS sends a confirmation email automatically. Errors: `400` validation, `401` bad key, `429` rate limited.

### Environment Variables

See [.env.example](.env.example):

- `DATABASE_URL` — PostgreSQL connection string
- `PAYLOAD_SECRET` — JWT signing secret
- `NEXT_PUBLIC_SERVER_URL` — Public base URL (used for CORS/CSRF and Payload serverURL). In development, keep this as `http://localhost:3002` or ensure `ALLOWED_ORIGINS` includes the dev origin.
- `ALLOWED_ORIGINS` — Comma-separated list of additional allowed CORS/CSRF origins
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — Optional email sending
- `DATABASE_SSL_REJECT_UNAUTHORIZED` — Set to `false` if your production DB uses a self-signed cert
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token; when absent the plugin is disabled and files fall back to local `/public/media`

### Generated Files

`src/payload-types.ts`, `next-env.d.ts`, and `src/app/(payload)/admin/importMap.js` are auto-generated — do not edit manually. Run `pnpm generate:types` after changing any collection schema. Restart the dev server after changing any component registered in `admin.components`.
