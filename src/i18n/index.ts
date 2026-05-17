export { uz } from './uz';
export { ko } from './ko';
export type { TranslationKey } from './uz';

import type { TranslationKey } from './uz';
import { uz } from './uz';
import { ko } from './ko';

export type Locale = 'uz' | 'ko';

const catalogs: Record<Locale, Record<TranslationKey, string>> = {
  uz,
  ko,
};

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let text = catalogs[locale][key] ?? catalogs.uz[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replaceAll(`{{${k}}}`, String(v));
    });
  }
  return text;
}
