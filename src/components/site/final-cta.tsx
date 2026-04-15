import { ArrowUpRight, Mail, MessageCircle, Network } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HomeContent } from "@/content/types";

const iconMap = {
  Email: Mail,
  WhatsApp: MessageCircle,
  LinkedIn: Network,
};

type FinalCtaProps = {
  content: HomeContent["finalCta"];
};

export function FinalCta({ content }: FinalCtaProps) {
  return (
    <section id="contato" className="px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <Card className="overflow-hidden rounded-[40px] border-[color:var(--border-inverse)] bg-[linear-gradient(160deg,var(--accent-strong),var(--accent)_52%,color-mix(in_srgb,var(--primary)_74%,var(--accent)_26%)_130%)] shadow-[var(--shadow-strong)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(200,148,90,0.16),transparent_22%)]" />
            <CardContent className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-10">
              <div className="space-y-6">
                <Badge className="w-fit border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse)] text-[color:var(--foreground-inverse-muted)] shadow-none">
                  {content.eyebrow}
                </Badge>
                <div className="space-y-4">
                  <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-[-0.07em] text-[color:var(--foreground-inverse)] sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                    {content.title}
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-[color:var(--foreground-inverse-muted)] sm:text-lg">
                    {content.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="min-w-[244px] justify-between">
                    <a
                      href={content.primaryCta.href}
                      target={content.primaryCta.external ? "_blank" : undefined}
                      rel={content.primaryCta.external ? "noreferrer" : undefined}
                    >
                      {content.primaryCta.label}
                      <ArrowUpRight />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="min-w-[248px] border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse)] text-[color:var(--foreground-inverse)] shadow-[0_18px_34px_rgba(4,10,18,0.18)] hover:border-[color:rgba(247,242,235,0.22)] hover:bg-[color:var(--surface-inverse-strong)] hover:text-[color:var(--foreground-inverse)]"
                  >
                    <a
                      href={content.secondaryCta.href}
                      target={content.secondaryCta.external ? "_blank" : undefined}
                      rel={content.secondaryCta.external ? "noreferrer" : undefined}
                    >
                      {content.secondaryCta.label}
                    </a>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {content.methods.map((item, index) => {
                  const Icon = iconMap[item.label as keyof typeof iconMap];

                  return (
                    <Reveal key={item.label} delay={index * 90}>
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                        className="group rounded-[28px] border border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse)] p-5 backdrop-blur-sm transition-[transform,border-color,background-color,box-shadow] duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[color:rgba(247,242,235,0.22)] hover:bg-[color:var(--surface-inverse-strong)] hover:shadow-[0_24px_46px_rgba(3,8,15,0.16)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-11 items-center justify-center rounded-2xl border border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
                                <Icon className="size-5 text-[color:var(--foreground-inverse-muted)]" />
                              </span>
                              <div className="space-y-1">
                                <span className="block text-lg font-semibold tracking-[-0.04em] text-[color:var(--foreground-inverse)]">
                                  {item.label}
                                </span>
                                <span className="block text-sm font-medium text-[color:var(--foreground-inverse)]">
                                  {item.value}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm leading-7 text-[color:var(--foreground-inverse-muted)]">
                              {item.description}
                            </p>
                          </div>
                          <ArrowUpRight className="mt-1 size-4 text-[color:var(--foreground-inverse-muted)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </a>
                    </Reveal>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
