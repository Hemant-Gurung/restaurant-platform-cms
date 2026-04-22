"use client";

import { useRouter } from "next/navigation";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "nl", label: "NL" },
];

function getCurrentLang(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)payload-lng=([^;]+)/);
  return match?.[1] ?? navigator.language.slice(0, 2) ?? "en";
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const current = getCurrentLang();

  const switchLang = (code: string) => {
    document.cookie = `payload-lng=${code}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 16px", alignItems: "center" }}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLang(code)}
          style={{
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: current === code ? 700 : 400,
            borderRadius: 4,
            border: `1px solid ${current === code ? "var(--theme-text)" : "var(--theme-elevation-200)"}`,
            background: current === code ? "var(--theme-text)" : "transparent",
            color: current === code ? "var(--theme-bg)" : "var(--theme-elevation-400)",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
