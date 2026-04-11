import type { PayloadRequest, Where } from "payload";

export type RestaurantSlug = "my-restaurant" | "verde-kitchen";

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
 * Read access for PUBLIC collections (menu items, categories).
 *
 * - API key with a restaurant → scoped WHERE filter (only that restaurant's docs)
 * - Admin panel or unauthenticated → full access (all docs)
 */
export function publicRestaurantRead({
  req,
}: {
  req: PayloadRequest;
}): boolean | Where {
  const restaurant = getRequestRestaurant(req);
  if (restaurant) {
    return { restaurant: { equals: restaurant } };
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
