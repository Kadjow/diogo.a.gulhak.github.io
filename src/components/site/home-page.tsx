import { ApproachSection } from "@/components/site/approach-section";
import { CapabilitiesSection } from "@/components/site/capabilities-section";
import { CasesSection } from "@/components/site/cases-section";
import { FinalCta } from "@/components/site/final-cta";
import { Hero } from "@/components/site/hero";
import { LocaleHtmlSync } from "@/components/site/locale-html-sync";
import { ProofStrip } from "@/components/site/proof-strip";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import type { HomeContent } from "@/content/types";
import type { Locale } from "@/i18n/config";

type HomePageProps = {
  locale: Locale;
  content: HomeContent;
};

export function HomePage({ locale, content }: HomePageProps) {
  return (
    <>
      <LocaleHtmlSync locale={locale} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[color:var(--foreground)] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {content.common.skipToContent}
      </a>

      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_62%)]" />
        <div className="absolute left-[-120px] top-[180px] -z-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,var(--secondary-soft),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-110px] top-[250px] -z-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,var(--primary-soft),transparent_72%)] blur-3xl" />
        <div className="absolute inset-x-0 top-[720px] -z-10 h-[860px] bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.2)_18%,rgba(16,32,49,0.03)_52%,transparent)]" />

        <SiteHeader
          items={content.header.nav}
          brand={content.header.brand}
          monogram={content.header.monogram}
          statusLabel={content.header.statusLabel}
          status={content.header.status}
          cta={content.header.cta}
          locale={locale}
          localeSwitchLabel={content.header.localeSwitchLabel}
        />

        <main id="main-content">
          <Hero content={content.hero} />
          <ProofStrip content={content.proofStrip} />
          <CasesSection content={content.cases} />
          <ApproachSection content={content.approach} />
          <CapabilitiesSection content={content.capabilities} />
          <FinalCta content={content.finalCta} />
        </main>

        <SiteFooter content={content.footer} />
      </div>
    </>
  );
}
