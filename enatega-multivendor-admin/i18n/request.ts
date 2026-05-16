import { getUserLocale } from '@/lib/utils/methods/locale';
import { getRequestConfig } from 'next-intl/server';

// English base overlaid by the active locale so a missing/partial key never
// renders raw (Orda ships German by default; de.json is ~complete, English
// is the safety net for the few gaps and any future keys).
function deepMerge(base: any, override: any): any {
  if (!override) return base;
  const out: any = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(override)) {
    const ov = override[k];
    if (
      ov &&
      typeof ov === 'object' &&
      !Array.isArray(ov) &&
      base &&
      typeof base[k] === 'object'
    ) {
      out[k] = deepMerge(base[k], ov);
    } else if (ov !== '' && ov != null) {
      out[k] = ov;
    }
  }
  return out;
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  const en = (await import(`../locales/en.json`)).default;
  let messages = en;
  if (locale && locale !== 'en') {
    try {
      const localeMessages = (await import(`../locales/${locale}.json`))
        .default;
      messages = deepMerge(en, localeMessages);
    } catch {
      messages = en;
    }
  }

  return { locale, messages };
});
