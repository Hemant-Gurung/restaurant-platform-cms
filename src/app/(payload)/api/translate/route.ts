import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const DEEPL_LOCALE_MAP: Record<string, string> = {
  en: "EN",
  fr: "FR",
  nl: "NL",
};

const ALL_LOCALES = ["en", "fr", "nl"] as const;
type Locale = (typeof ALL_LOCALES)[number];

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sourceLocale, targetLocale } = await req.json() as {
    id: string;
    sourceLocale: Locale;
    targetLocale: Locale;
  };

  if (!id || !DEEPL_LOCALE_MAP[sourceLocale] || !DEEPL_LOCALE_MAP[targetLocale]) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  if (sourceLocale === targetLocale) {
    return NextResponse.json({ error: "Source and target locale are the same" }, { status: 400 });
  }

  // Fetch the source content in the chosen locale
  const doc = await payload.findByID({
    collection: "site-content",
    id,
    locale: sourceLocale,
    depth: 0,
    overrideAccess: true,
  }) as { tagline?: string; description?: string };

  const toTranslate = Object.entries({
    tagline: doc.tagline,
    description: doc.description,
  }).filter(([, v]) => typeof v === "string" && (v as string).trim()) as [string, string][];

  if (!toTranslate.length) {
    return NextResponse.json({ error: "No text to translate in source locale" }, { status: 400 });
  }

  const deeplRes = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: toTranslate.map(([, v]) => v),
      source_lang: DEEPL_LOCALE_MAP[sourceLocale],
      target_lang: DEEPL_LOCALE_MAP[targetLocale],
    }),
  });

  if (!deeplRes.ok) {
    const err = await deeplRes.text();
    console.error("DeepL error:", err);
    return NextResponse.json({ error: "Translation service error" }, { status: 502 });
  }

  const { translations } = await deeplRes.json() as { translations: { text: string }[] };

  const translated = Object.fromEntries(
    toTranslate.map(([key], i) => [key, translations[i].text]),
  );

  await payload.update({
    collection: "site-content",
    id,
    locale: targetLocale,
    data: translated,
    overrideAccess: false,
    user,
  });

  return NextResponse.json({ success: true, translated });
}
