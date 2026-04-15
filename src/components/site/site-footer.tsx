import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { HomeContent } from "@/content/types";

type SiteFooterProps = {
  content: HomeContent["footer"];
};

export function SiteFooter({ content }: SiteFooterProps) {
  return (
    <footer className="px-6 pb-10 pt-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="rounded-[36px] border border-[color:var(--border-strong)] bg-[linear-gradient(180deg,var(--surface-elevated),color-mix(in_srgb,var(--surface-strong)_84%,var(--secondary-soft)))] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_0.8fr_0.8fr] lg:items-start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    {content.name}
                  </span>
                  <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.06em] text-[color:var(--foreground)] sm:text-[2rem]">
                    {content.role}
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-[color:var(--foreground-soft)]">
                  {content.description}
                </p>
              </div>

              <div className="space-y-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  {content.navigationLabel}
                </span>
                <div className="flex flex-col gap-3">
                  {content.navigationLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="group inline-flex items-center justify-between gap-3 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)] transition-[transform,border-color,background-color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:bg-[color:var(--surface-strong)] hover:shadow-[var(--shadow-medium)]"
                    >
                      {link.label}
                      <ArrowUpRight className="size-4 text-[color:var(--muted)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  {content.connectLabel}
                </span>
                <div className="flex flex-col gap-3">
                  {content.connectLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="group inline-flex items-center justify-between gap-3 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)] transition-[transform,border-color,background-color,box-shadow] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:bg-[color:var(--surface-strong)] hover:shadow-[var(--shadow-medium)]"
                    >
                      {link.label}
                      <ArrowUpRight className="size-4 text-[color:var(--muted)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-[color:var(--border)] pt-5">
              <p className="text-sm leading-7 text-[color:var(--muted-strong)]">{content.note}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
