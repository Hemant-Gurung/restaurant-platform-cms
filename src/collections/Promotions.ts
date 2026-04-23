import type { CollectionConfig } from "payload";
import { RESTAURANTS } from "../lib/restaurants";
import {
  publicRestaurantRead,
  restaurantCreate,
  restaurantUpdate,
  restaurantDelete,
  stampRestaurant,
} from "../lib/access";

export const Promotions: CollectionConfig = {
  slug: "promotions",
  labels: {
    singular: { en: "Promotion", fr: "Promotion", nl: "Promotie" },
    plural: { en: "Promotions", fr: "Promotions", nl: "Promoties" },
  },
  access: {
    read: publicRestaurantRead,
    create: restaurantCreate,
    update: restaurantUpdate,
    delete: restaurantDelete,
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => stampRestaurant({ req, data }),
    ],
  },
  admin: {
    useAsTitle: "title",
    group: { en: "Settings", fr: "Paramètres", nl: "Instellingen" },
    defaultColumns: ["title", "active", "startDate", "endDate"],
  },
  fields: [
    {
      name: "restaurant",
      type: "select",
      required: true,
      options: RESTAURANTS,
      label: { en: "Restaurant", fr: "Restaurant", nl: "Restaurant" },
      admin: {
        position: "sidebar",
        condition: (_, siblingData, { user }) => {
          return !((user as Record<string, unknown>)?.restaurant);
        },
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      label: { en: "Active", fr: "Actif", nl: "Actief" },
      admin: {
        position: "sidebar",
        description: {
          en: "Uncheck to hide this promotion",
          fr: "Décochez pour masquer cette promotion",
          nl: "Uitvinken om deze promotie te verbergen",
        },
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: { en: "Image", fr: "Image", nl: "Afbeelding" },
      admin: {
        position: "sidebar",
        description: {
          en: "Optional banner image",
          fr: "Image bannière (optionnel)",
          nl: "Optionele bannerafbeelding",
        },
      },
    },
    {
      name: "startDate",
      type: "date",
      label: { en: "Start Date", fr: "Date de début", nl: "Startdatum" },
      admin: {
        position: "sidebar",
        description: {
          en: "Show from this date (leave empty to show immediately)",
          fr: "Afficher à partir de cette date (laisser vide pour afficher immédiatement)",
          nl: "Tonen vanaf deze datum (leeg laten om direct te tonen)",
        },
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "endDate",
      type: "date",
      label: { en: "End Date", fr: "Date de fin", nl: "Einddatum" },
      admin: {
        position: "sidebar",
        description: {
          en: "Auto-hide after this date (leave empty to show indefinitely)",
          fr: "Masquer automatiquement après cette date (laisser vide pour afficher indéfiniment)",
          nl: "Automatisch verbergen na deze datum (leeg laten om onbepaald te tonen)",
        },
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    {
      name: "dismissDays",
      type: "number",
      defaultValue: 1,
      min: 0,
      label: { en: "Re-show After (days)", fr: "Réafficher après (jours)", nl: "Opnieuw tonen na (dagen)" },
      admin: {
        position: "sidebar",
        description: {
          en: "Days before re-showing after dismissal. 0 = never re-show.",
          fr: "Jours avant de réafficher après fermeture. 0 = ne plus afficher.",
          nl: "Dagen voor hervertoning na sluiting. 0 = nooit opnieuw tonen.",
        },
        step: 1,
      },
    },
    {
      name: "translateHelper",
      type: "ui",
      admin: {
        components: {
          Field: "@/components/TranslateButton#default",
        },
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      label: { en: "Title", fr: "Titre", nl: "Titel" },
    },
    {
      name: "message",
      type: "textarea",
      localized: true,
      label: { en: "Message", fr: "Message", nl: "Bericht" },
    },
    {
      name: "ctaLabel",
      type: "text",
      label: { en: "CTA Label", fr: "Libellé du bouton", nl: "Knoptekst" },
      admin: {
        description: {
          en: 'e.g. "Order Now"',
          fr: 'ex. "Commander maintenant"',
          nl: 'bijv. "Bestel nu"',
        },
      },
    },
    {
      name: "ctaUrl",
      type: "text",
      label: { en: "CTA URL", fr: "Lien du bouton", nl: "Knoplink" },
      admin: {
        description: {
          en: "Link for the CTA button",
          fr: "Lien pour le bouton d'appel à l'action",
          nl: "Link voor de actieknop",
        },
      },
    },
  ],
  timestamps: true,
};
