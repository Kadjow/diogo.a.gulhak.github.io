export const SUPPORTED_LOCALES = ["pt-BR", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

export function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getLocaleHref(locale: Locale) {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}
