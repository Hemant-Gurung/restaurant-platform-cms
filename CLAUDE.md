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

### Payload Config

[src/payload.config.ts](src/payload.config.ts) is the single source of truth. Key settings:
- **Database**: PostgreSQL via `DATABASE_URL`; `push: true` in development (schema auto-syncs without migrations)
- **Email**: Resend adapter, configured via `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- **CORS**: Allows `localhost:3000`, `localhost:3001`, and `NEXT_PUBLIC_SERVER_URL`
- **Media**: Uploads stored in `/public/media`, generates a 400×300 thumbnail

### Collections

| Collection | Slug | Access |
|---|---|---|
| Admins | `admins` | Auth + API key; optional restaurant scope |
| MenuCategories | `menu-categories` | Public read (restaurant-scoped) |
| MenuItems | `menu-items` | Public read (restaurant-scoped) |
| Media | `media` | Standard upload |
| Reservations | `reservations` | Authenticated read; no deletes |
| ContactMessages | `contact-messages` | Authenticated read; no updates/deletes |

`Admins` without a restaurant set are treated as super-admins with access to all restaurants.

### Routing

```
/                          → redirects to /admin
/admin/[[...segments]]     → Payload admin panel
/api/[[...slug]]           → Payload REST API
```

The `(payload)` route group in [src/app/(payload)/](src/app/(payload)/) wires Payload into Next.js using `withPayload()` in [next.config.ts](next.config.ts).

### Path Aliases

```
@/*             → src/*
@payload-config → src/payload.config.ts
```

### Environment Variables

See [.env.example](.env.example):
- `DATABASE_URL` — PostgreSQL connection string
- `PAYLOAD_SECRET` — JWT signing secret
- `NEXT_PUBLIC_SERVER_URL` — Public base URL (used for CORS and Payload server URL)
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — Optional email sending

### Generated Files

`src/payload-types.ts` and `next-env.d.ts` are auto-generated — do not edit manually. Run `pnpm generate:types` after changing any collection schema.
