import { getUserLocale } from "@/lib/utils/methods/";
import { getRequestConfig } from "next-intl/server";

// Deep-merge helper: locale messages overlaid on the English base so a
// missing/partial locale never renders raw keys (Orda ships German by
// default; de.json is completed progressively — English is the safety net).
function deepMerge(base: any, override: any): any {
  if (!override) return base;
  const out: any = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(override)) {
    const ov = override[k];
    if (
      ov &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      base &&
      typeof base[k] === "object"
    ) {
      out[k] = deepMerge(base[k], ov);
    } else if (ov !== "" && ov != null) {
      out[k] = ov;
    }
  }
  return out;
}

// next-intl treats "." in a message key as nesting and HARD-THROWS on load
// ("INVALID_KEY: Namespace keys can not contain the character '.'"). The
// upstream Enatega en.json ships keys like `your@email.com` and
// `Select_your_address.` — a single one of them white-screens the whole app
// (login/registration unreachable). Strip any dotted key at every level so
// one bad upstream key can never take the site down again.
function stripDottedKeys(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripDottedKeys);
  const out: any = {};
  for (const k of Object.keys(obj)) {
    if (k.includes(".")) continue;
    out[k] = stripDottedKeys(obj[k]);
  }
  return out;
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  const en = (await import(`../locales/en.json`)).default;
  let messages = en;
  if (locale && locale !== "en") {
    try {
      const localeMessages = (await import(`../locales/${locale}.json`)).default;
      messages = deepMerge(en, localeMessages);
    } catch {
      // Unknown locale file — fall back entirely to English.
      messages = en;
    }
  }

  return { locale, messages: stripDottedKeys(messages) };
});
