export type RestaurantType = "eat-in" | "takeaway";

export const RESTAURANTS: { label: string; value: string; type: RestaurantType }[] = [
  { label: "My Restaurant", value: "my-restaurant", type: "eat-in" },
  { label: "Verde Kitchen", value: "verde-kitchen", type: "eat-in" },
];

export type RestaurantSlug = "my-restaurant" | "verde-kitchen";
