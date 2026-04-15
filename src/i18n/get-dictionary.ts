import enHome from "@/content/en/home.json";
import ptBRHome from "@/content/pt-BR/home.json";
import type { HomeContent } from "@/content/types";

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

const dictionaries: Record<Locale, HomeContent> = {
  "pt-BR": ptBRHome as HomeContent,
  en: enHome as HomeContent,
};

export function getDictionary(locale: Locale = DEFAULT_LOCALE) {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
