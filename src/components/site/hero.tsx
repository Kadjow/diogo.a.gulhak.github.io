import Image from "next/image";
import { ArrowRight, Layers3, ShieldCheck, Workflow } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeContent } from "@/content/types";

const highlightIcons = [Layers3, Workflow, ShieldCheck];

type HeroProps = {
  content: HomeContent["hero"];
};

export function Hero({ content }: HeroProps) {
  return (
    <section id="top" className="relative px-6 pb-16 pt-6 lg:px-10 lg:pt-9">
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 mx-auto h-[520px] max-w-7xl bg-[radial-gradient(circle_at_12%_18%,var(--primary-soft),transparent_22%),radial-gradient(circle_at_82%_22%,var(--secondary-soft),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.4),transparent)]" />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start xl:gap-12">
        <Reveal className="space-y-7 lg:space-y-9" priority>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="accent" className="w-fit">
              {content.eyebrow}
            </Badge>
          </div>

          <div className="space-y-6">
            <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.09em] text-[color:var(--foreground)] sm:text-5xl lg:text-[4.7rem] lg:leading-[0.98]">
              {content.title}
            </h1>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-[color:var(--muted-strong)] sm:text-[1.28rem] sm:leading-9">
              {content.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="min-w-[252px] justify-between">
              <a
                href={content.primaryCta.href}
                target={content.primaryCta.external ? "_blank" : undefined}
                rel={content.primaryCta.external ? "noreferrer" : undefined}
              >
                {content.primaryCta.label}
                <ArrowRight />
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg" className="min-w-[228px]">
              <a href={content.secondaryCta.href}>{content.secondaryCta.label}</a>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {content.highlights.map((item, index) => {
              const Icon = highlightIcons[index % highlightIcons.length];

              return (
                <Reveal key={item.title} delay={index * 90} priority>
                  <Card className="h-full rounded-[28px] border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-elevated),var(--surface))] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:shadow-[var(--shadow-medium)]">
                    <CardContent className="space-y-5 pt-6">
                      <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-2xl border border-[color:var(--primary-border)] bg-[color:var(--primary-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                          <Icon className="size-5 text-[color:var(--primary-strong)]" />
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                          0{index + 1}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold tracking-[-0.05em] text-[color:var(--foreground)]">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={120} priority className="lg:pt-6">
          <Card className="overflow-hidden rounded-[36px] border-[color:var(--border-inverse)] bg-[linear-gradient(180deg,var(--accent-strong),var(--accent)_56%,color-mix(in_srgb,var(--primary)_48%,var(--accent)_52%)_100%)] shadow-[var(--shadow-strong)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(19,138,120,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(200,148,90,0.16),transparent_26%)]" />
            <CardHeader className="relative gap-8 border-b border-[color:var(--border-inverse)]">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                <div className="max-w-xl space-y-4">
                  <Badge className="w-fit border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse)] text-[color:var(--foreground-inverse-muted)] shadow-none">
                    {content.aside.eyebrow}
                  </Badge>
                  <div className="space-y-3">
                    <CardTitle className="text-2xl text-[color:var(--foreground-inverse)] sm:text-[2.15rem]">
                      {content.aside.title}
                    </CardTitle>
                    <p className="text-base leading-8 text-[color:var(--foreground-inverse-muted)]">
                      {content.aside.description}
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[30px] border border-[color:var(--border-inverse)] bg-[linear-gradient(180deg,var(--surface-inverse-strong),var(--surface-inverse))] p-2 shadow-[0_26px_60px_rgba(0,0,0,0.22)]">
                  <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_72%)]" />
                  <Image
                    src="/images/diogo-gulhak.jpg"
                    alt={content.aside.imageAlt}
                    width={280}
                    height={320}
                    className="relative h-[300px] w-full rounded-[24px] object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[224px]"
                    priority
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pt-7">
              <div className="grid gap-3">
                {content.aside.details.map((detail, index) => (
                  <Reveal key={detail.label} delay={180 + index * 70} priority>
                    <div className="grid gap-2 rounded-[22px] border border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse)] px-5 py-4 backdrop-blur-sm sm:grid-cols-[160px_1fr] sm:items-start">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--foreground-inverse-subtle)]">
                        {detail.label}
                      </span>
                      <p className="text-sm leading-7 text-[color:var(--foreground-inverse-muted)]">
                        {detail.value}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
