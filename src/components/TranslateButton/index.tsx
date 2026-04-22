"use client";

import { useState } from "react";

const LOCALES = [
  { code: "fr", label: "French 🇫🇷" },
  { code: "nl", label: "Dutch 🇳🇱" },
];

function getDocumentId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  // Payload admin URL: /admin/collections/site-content/[id]
  const match = window.location.pathname.match(/\/collections\/[^/]+\/([^/?#]+)/);
  const id = match?.[1];
  return id && id !== "create" ? id : undefined;
}

export default function TranslateButton() {
  const id = getDocumentId();
  const [status, setStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});

  if (!id) {
    return (
      <p style={{ fontSize: 12, color: "var(--theme-elevation-400)", marginBottom: 16 }}>
        Save the document first to enable auto-translate.
      </p>
    );
  }

  const translate = async (targetLocale: string) => {
    setStatus((s) => ({ ...s, [targetLocale]: "loading" }));
    try {
      // Fetch current EN values from the saved document
      const docRes = await fetch(`/api/site-content/${id}?locale=en&depth=0`, {
        credentials: "include",
      });
      if (!docRes.ok) throw new Error("Could not fetch document");
      const doc = await docRes.json() as { tagline?: string; description?: string };

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id,
          fields: { tagline: doc.tagline, description: doc.description },
          targetLocale,
        }),
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

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 12, color: "var(--theme-elevation-400)", marginBottom: 8 }}>
        Auto-translate tagline &amp; description from English
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        {LOCALES.map(({ code, label }) => {
          const s = status[code] ?? "idle";
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
                ? "Translating…"
                : s === "done"
                  ? "✓ Saved"
                  : s === "error"
                    ? "✗ Error"
                    : `Translate to ${label}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
