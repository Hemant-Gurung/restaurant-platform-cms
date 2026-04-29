import type { BasePayload } from "payload";

const DEEPL_LOCALE_MAP: Record<string, string> = { en: "EN", fr: "FR", nl: "NL" };
const TARGET_LOCALES = ["fr", "nl"] as const;

export async function autoTranslate({
  payload,
  collection,
  id,
  fields,
  sourceData,
}: {
  payload: BasePayload;
  collection: string;
  id: string;
  fields: string[];
  sourceData: Record<string, unknown>;
}) {
  if (!process.env.DEEPL_API_KEY) return;

  const toTranslate = fields
    .map((key) => [key, sourceData[key]] as [string, unknown])
    .filter(([, v]) => typeof v === "string" && (v as string).trim()) as [string, string][];

  if (!toTranslate.length) return;

  for (const targetLocale of TARGET_LOCALES) {
    try {
      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: toTranslate.map(([, v]) => v),
          source_lang: DEEPL_LOCALE_MAP.en,
          target_lang: DEEPL_LOCALE_MAP[targetLocale],
        }),
      });

      if (!res.ok) continue;

      const { translations } = await res.json() as { translations: { text: string }[] };
      const translated = Object.fromEntries(
        toTranslate.map(([key], i) => [key, translations[i].text]),
      );

      await payload.update({
        collection,
        id,
        locale: targetLocale,
        data: translated,
        overrideAccess: true,
      });
    } catch (err) {
      console.error(`Auto-translate ${collection} to ${targetLocale} failed:`, err);
    }
  }
}
