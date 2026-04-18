import type { PayloadRequest, Where } from "payload";
import { type RestaurantSlug } from "./restaurants";

export type { RestaurantSlug };

/**
 * Extracts the restaurant slug from the authenticated request.
 *
 * - API key user with a `restaurant` field → returns that restaurant
 * - Admin panel user (no restaurant field) → returns null (full access)
 * - Unauthenticated → returns null
 */
export function getRequestRestaurant(req: PayloadRequest): RestaurantSlug | null {
  if (!req.user) return null;
  return ((req.user as Record<string, unknown>).restaurant as RestaurantSlug) ?? null;
}

/**
 * Read access for PUBLIC collections (sections, tables, menu items, categories).
 *
 * - API key with a restaurant → scoped WHERE filter (only that restaurant's docs)
 * - Super-admin (authenticated, no restaurant field) → full access
 * - Unauthenticated + ?restaurant=<slug> query param → scoped to that restaurant
 * - Unauthenticated, no param → full access (public data)
 *
 * The ?restaurant= param lets the frontend filter without an API key.
 * Always pass it: GET /api/sections?restaurant=my-restaurant
 */
export function publicRestaurantRead({
  req,
}: {
  req: PayloadRequest;
}): boolean | Where {
  // API key user with restaurant scope → auto-filter
  const restaurant = getRequestRestaurant(req);
  if (restaurant) {
    return { restaurant: { equals: restaurant } };
  }
  // Super-admin (authenticated, no restaurant field) → full access
  if (req.user) return true;
  // Unauthenticated → scope by ?restaurant= query param if provided
  try {
    const url = req.url ? new URL(req.url) : null;
    const qRestaurant = url?.searchParams.get("restaurant");
    if (qRestaurant) {
      return { restaurant: { equals: qRestaurant } };
    }
  } catch {
    // req.url may be relative in some contexts — fall through to full access
  }
  return true;
}

/**
 * Read access for PRIVATE collections (reservations, contact messages).
 *
 * - Unauthenticated → denied
 * - API key with a restaurant → scoped WHERE filter
 * - Admin panel user → full access
 */
export function privateRestaurantRead({
  req,
}: {
  req: PayloadRequest;
}): boolean | Where {
  if (!req.user) return false;
  const restaurant = getRequestRestaurant(req);
  if (restaurant) {
    return { restaurant: { equals: restaurant } };
  }
  return true;
}

/**
 * Create access for collections.
 *
 * - API key user → allowed (restaurant will be auto-stamped via beforeChange)
 * - Admin panel user → allowed
 * - Unauthenticated → denied
 */
export function restaurantCreate({ req }: { req: PayloadRequest }): boolean {
  return Boolean(req.user);
}

/**
 * Update access for content collections (menu items, categories).
 *
 * - Unauthenticated → denied
 * - Scoped admin (has restaurant) → can only update documents belonging to their restaurant
 * - Super-admin (no restaurant field) → full access
 */
export function restaurantUpdate({
  req,
}: {
  req: PayloadRequest;
}): boolean | Where {
  if (!req.user) return false;
  const restaurant = getRequestRestaurant(req);
  if (restaurant) {
    return { restaurant: { equals: restaurant } };
  }
  return true;
}

/**
 * Delete access for content collections (menu items, categories).
 * Same rules as update — scoped admins can only delete their own restaurant's content.
 */
export function restaurantDelete({
  req,
}: {
  req: PayloadRequest;
}): boolean | Where {
  if (!req.user) return false;
  const restaurant = getRequestRestaurant(req);
  if (restaurant) {
    return { restaurant: { equals: restaurant } };
  }
  return true;
}

/**
 * beforeChange hook: auto-stamps the `restaurant` field from the API key / admin user.
 * Prevents scoped admins from manually assigning content to a different restaurant.
 */
export function stampRestaurant({
  req,
  data,
}: {
  req: PayloadRequest;
  data: Record<string, unknown>;
}): Record<string, unknown> {
  const restaurant = getRequestRestaurant(req);
  if (restaurant) {
    data.restaurant = restaurant;
  }
  return data;
}
