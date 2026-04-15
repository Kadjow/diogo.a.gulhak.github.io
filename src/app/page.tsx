import { HomePage } from "@/components/site/home-page";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default function Home() {
  const content = getDictionary(DEFAULT_LOCALE);

  return <HomePage locale={DEFAULT_LOCALE} content={content} />;
}
