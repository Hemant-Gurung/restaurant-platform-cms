import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const DEEPL_LOCALE_MAP: Record<string, string> = {
  fr: "FR",
  nl: "NL",
};

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fields, targetLocale } = await req.json() as {
    id: string;
    fields: { tagline?: string; description?: string };
    targetLocale: "fr" | "nl";
  };

  if (!id || !fields || !targetLocale || !DEEPL_LOCALE_MAP[targetLocale]) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const toTranslate = Object.entries(fields).filter(
    ([, v]) => typeof v === "string" && v.trim(),
  ) as [string, string][];

  if (!toTranslate.length) {
    return NextResponse.json({ error: "No text to translate" }, { status: 400 });
  }

  const deeplRes = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: toTranslate.map(([, v]) => v),
      source_lang: "EN",
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
