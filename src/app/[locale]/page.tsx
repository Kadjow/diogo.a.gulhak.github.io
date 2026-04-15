import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomePage } from "@/components/site/home-page";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({
    locale,
  }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale) || locale === DEFAULT_LOCALE) {
    return {};
  }

  const content = getDictionary(locale);

  return {
    title: content.metadata.title,
    description: content.metadata.description,
  };
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale) || locale === DEFAULT_LOCALE) {
    notFound();
  }

  const content = getDictionary(locale);

  return <HomePage locale={locale} content={content} />;
}
