"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ActionLink, NavItem } from "@/content/types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getLocaleHref, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  items: NavItem[];
  brand: string;
  monogram: string;
  statusLabel: string;
  status: string;
  cta: ActionLink;
  locale: Locale;
  localeSwitchLabel: string;
};

export function SiteHeader({
  items,
  brand,
  monogram,
  statusLabel,
  status,
  cta,
  locale,
  localeSwitchLabel,
}: SiteHeaderProps) {
  const [activeHref, setActiveHref] = useState("");

  const handleHashChange = useEffectEvent(() => {
    setActiveHref(window.location.hash);
  });

  useEffect(() => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    const sections = items
      .map((item) => document.getElementById(item.href.replace("#", "")))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveHref(`#${visibleEntry.target.id}`);
        }
      },
      {
        rootMargin: "-24% 0px -58% 0px",
        threshold: [0.2, 0.35, 0.55],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [items]);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 lg:px-6">
      <div className="mx-auto max-w-[84rem]">
        <div className="overflow-hidden rounded-[30px] border border-[color:var(--border-strong)] bg-[color:color-mix(in_srgb,var(--surface-elevated)_88%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-2xl">
          <div className="px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <a
                href="#top"
                className="group inline-flex min-h-11 shrink-0 items-center gap-3 overflow-visible text-[color:var(--foreground)]"
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[color:var(--primary-border)] bg-[linear-gradient(145deg,var(--surface-elevated),rgba(255,255,255,0.72)_32%,var(--primary-soft)_120%)] text-[13px] shadow-[var(--shadow-soft)] before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.92),transparent)] before:content-[''] after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32),transparent_58%)] after:opacity-0 after:transition-opacity after:duration-[280ms] after:content-[''] group-hover:after:opacity-100">
                  {monogram}
                </span>
                <span className="hidden min-w-0 whitespace-nowrap text-[0.78rem] font-semibold uppercase leading-[1.1] tracking-[0.24em] text-[color:var(--foreground)] sm:inline">
                  {brand}
                </span>
              </a>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:flex">
                  {SUPPORTED_LOCALES.map((targetLocale) => {
                    const isCurrent = locale === targetLocale;

                    return (
                      <a
                        key={targetLocale}
                        href={getLocaleHref(targetLocale)}
                        aria-label={`${localeSwitchLabel}: ${targetLocale === DEFAULT_LOCALE ? "Português" : "English"}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-[transform,background-color,color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                          isCurrent
                            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-[var(--shadow-button)]"
                            : "text-[color:var(--muted-strong)] hover:-translate-y-0.5 hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--foreground)]",
                        )}
                      >
                        {targetLocale === DEFAULT_LOCALE ? "PT" : "EN"}
                      </a>
                    );
                  })}
                </div>

                <Button asChild size="sm" className="min-w-[168px] justify-between sm:min-w-[188px]">
                  <a href={cta.href}>
                    {cta.label}
                    <ArrowUpRight />
                  </a>
                </Button>
              </div>
            </div>

            <div className="hidden lg:grid lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
              <a
                href="#top"
                className="group inline-flex min-h-11 min-w-0 items-center gap-3 overflow-visible text-[color:var(--foreground)]"
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[color:var(--primary-border)] bg-[linear-gradient(145deg,var(--surface-elevated),rgba(255,255,255,0.72)_32%,var(--primary-soft)_120%)] text-[13px] shadow-[var(--shadow-soft)] before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.92),transparent)] before:content-[''] after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32),transparent_58%)] after:opacity-0 after:transition-opacity after:duration-[280ms] after:content-[''] group-hover:after:opacity-100">
                  {monogram}
                </span>
                <span className="min-w-0 whitespace-nowrap text-[0.78rem] font-semibold uppercase leading-[1.1] tracking-[0.24em] text-[color:var(--foreground)]">
                  {brand}
                </span>
              </a>

              <div className="min-w-0 justify-self-center">
                <nav className="flex min-w-0 max-w-[36rem] items-center justify-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  {items.map((item) => {
                    const isActive = activeHref === item.href;

                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-medium transition-[transform,background-color,color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                          isActive
                            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-[var(--shadow-button)]"
                            : "text-[color:var(--muted-strong)] hover:-translate-y-0.5 hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--foreground)]",
                        )}
                      >
                        {item.label}
                      </a>
                    );
                  })}
                </nav>
              </div>

              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <span className="hidden px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)] xl:inline">
                    {localeSwitchLabel}
                  </span>
                  {SUPPORTED_LOCALES.map((targetLocale) => {
                    const isCurrent = locale === targetLocale;

                    return (
                      <a
                        key={targetLocale}
                        href={getLocaleHref(targetLocale)}
                        aria-label={`${localeSwitchLabel}: ${targetLocale === DEFAULT_LOCALE ? "Português" : "English"}`}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-[transform,background-color,color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                          isCurrent
                            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-[var(--shadow-button)]"
                            : "text-[color:var(--muted-strong)] hover:-translate-y-0.5 hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--foreground)]",
                        )}
                      >
                        {targetLocale === DEFAULT_LOCALE ? "PT" : "EN"}
                      </a>
                    );
                  })}
                </div>

                <Button asChild size="sm" className="min-w-[176px] justify-between xl:min-w-[188px]">
                  <a href={cta.href}>
                    {cta.label}
                    <ArrowUpRight />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden border-t border-[color:var(--border)] px-6 py-3 lg:block">
            <div className="flex min-w-0 items-center gap-3 text-[0.76rem] text-[color:var(--muted-strong)]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                {statusLabel}
              </span>
              <div className="inline-flex min-w-0 max-w-[42rem] items-center gap-2 rounded-full border border-[color:var(--secondary-border)] bg-[linear-gradient(135deg,var(--surface-elevated),var(--secondary-surface))] px-3.5 py-2 shadow-[0_10px_24px_rgba(16,32,49,0.05)]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary-soft)]">
                  <CheckCircle2 className="size-3 text-[color:var(--primary-strong)]" />
                </span>
                <span className="truncate">{status}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[color:var(--border)] px-4 pb-4 pt-3 sm:px-5 lg:hidden">
            {items.map((item) => {
              const isActive = activeHref === item.href;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-[transform,background-color,color,box-shadow,border-color] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isActive
                      ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-[var(--shadow-button)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--muted-strong)] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--foreground)]",
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
