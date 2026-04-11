import type { CollectionConfig } from "payload";

/** True only for super-admins (no restaurant field set). */
const isSuperAdmin = (user: unknown): boolean =>
  Boolean(user) && !(user as Record<string, unknown>)?.restaurant;

export const Admins: CollectionConfig = {
  slug: "admins",
  // Enables built-in auth (sessions, password hashing) AND API key generation
  auth: {
    useAPIKey: true,
  },
  access: {
    // Super-admins see all accounts.
    // Scoped admins can only read/update their own account (powers the Account page).
    read: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
    update: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
    // Only super-admins can create or delete admin accounts
    create: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: "email",
    group: "Settings",
    defaultColumns: ["email", "restaurant", "createdAt"],
    // Hide the entire Admins section from the sidebar for scoped admins
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  fields: [
    // email and password are added automatically by auth
    {
      name: "restaurant",
      type: "select",
      // Leave empty for super-admins who manage all restaurants.
      // Set to a restaurant slug for app-specific API key users.
      options: [
        { label: "My Restaurant", value: "my-restaurant" },
        { label: "Verde Kitchen", value: "verde-kitchen" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Scope this admin to a single restaurant. Leave blank for full access (super-admin).",
      },
    },
  ],
  timestamps: true,
};
