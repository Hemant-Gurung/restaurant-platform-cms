"use client";

import { useTranslation } from "@payloadcms/ui";
import { useState } from "react";

const ALL_LOCALES = [
  { code: "en", label: "English 🇬🇧" },
  { code: "fr", label: "French 🇫🇷" },
  { code: "nl", label: "Dutch 🇳🇱" },
];

const UI_STRINGS = {
  en: {
    hint: (src: string) => `Translate tagline & description from ${src}`,
    translateTo: (lang: string) => `Translate to ${lang}`,
    translating: "Translating…",
    saved: "✓ Saved",
    error: "✗ Error",
    saveFirst: "Save the document first to enable auto-translate.",
  },
  fr: {
    hint: (src: string) => `Traduire le slogan et la description depuis ${src}`,
    translateTo: (lang: string) => `Traduire en ${lang}`,
    translating: "Traduction…",
    saved: "✓ Enregistré",
    error: "✗ Erreur",
    saveFirst: "Enregistrez d'abord le document pour activer la traduction automatique.",
  },
  nl: {
    hint: (src: string) => `Vertaal slogan en beschrijving vanuit ${src}`,
    translateTo: (lang: string) => `Vertalen naar ${lang}`,
    translating: "Vertalen…",
    saved: "✓ Opgeslagen",
    error: "✗ Fout",
    saveFirst: "Sla het document eerst op om automatisch vertalen in te schakelen.",
  },
};

const LOCALE_NAMES = {
  en: { en: "English 🇬🇧", fr: "Anglais 🇬🇧", nl: "Engels 🇬🇧" },
  fr: { en: "French 🇫🇷", fr: "Français 🇫🇷", nl: "Frans 🇫🇷" },
  nl: { en: "Dutch 🇳🇱", fr: "Néerlandais 🇳🇱", nl: "Nederlands 🇳🇱" },
};

function getCurrentLocale(): string {
  if (typeof window === "undefined") return "en";
  return new URLSearchParams(window.location.search).get("locale") ?? "en";
}

function getDocumentId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const match = window.location.pathname.match(/\/collections\/[^/]+\/([^/?#]+)/);
  const id = match?.[1];
  return id && id !== "create" ? id : undefined;
}

export default function TranslateButton() {
  const { i18n } = useTranslation();
  const uiLang = (i18n.language ?? "en") as keyof typeof UI_STRINGS;
  const t = UI_STRINGS[uiLang] ?? UI_STRINGS.en;

  const id = getDocumentId();
  const sourceLocale = getCurrentLocale() as keyof typeof LOCALE_NAMES;
  const targetLocales = ALL_LOCALES.filter((l) => l.code !== sourceLocale);
  const [status, setStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});

  if (!id) {
    return (
      <p style={{ fontSize: 12, color: "var(--theme-elevation-400)", marginBottom: 16 }}>
        {t.saveFirst}
      </p>
    );
  }

  const translate = async (targetLocale: string) => {
    setStatus((s) => ({ ...s, [targetLocale]: "loading" }));
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, sourceLocale, targetLocale }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Translation failed");
      }

      setStatus((s) => ({ ...s, [targetLocale]: "done" }));
      setTimeout(() => setStatus((s) => ({ ...s, [targetLocale]: "idle" })), 3000);
    } catch (err) {
      console.error(err);
      setStatus((s) => ({ ...s, [targetLocale]: "error" }));
      setTimeout(() => setStatus((s) => ({ ...s, [targetLocale]: "idle" })), 3000);
    }
  };

  const sourceName = LOCALE_NAMES[sourceLocale]?.[uiLang] ?? sourceLocale.toUpperCase();

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 12, color: "var(--theme-elevation-400)", marginBottom: 8 }}>
        {t.hint(sourceName)}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        {targetLocales.map(({ code }) => {
          const s = status[code] ?? "idle";
          const targetName = LOCALE_NAMES[code as keyof typeof LOCALE_NAMES]?.[uiLang] ?? code.toUpperCase();
          return (
            <button
              key={code}
              type="button"
              disabled={s === "loading"}
              onClick={() => translate(code)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 4,
                border: "1px solid var(--theme-elevation-200)",
                background:
                  s === "done"
                    ? "var(--theme-success-500)"
                    : s === "error"
                      ? "var(--theme-error-500)"
                      : "var(--theme-elevation-100)",
                color: s === "done" || s === "error" ? "#fff" : "var(--theme-text)",
                cursor: s === "loading" ? "wait" : "pointer",
              }}
            >
              {s === "loading"
                ? t.translating
                : s === "done"
                  ? t.saved
                  : s === "error"
                    ? t.error
                    : t.translateTo(targetName)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
