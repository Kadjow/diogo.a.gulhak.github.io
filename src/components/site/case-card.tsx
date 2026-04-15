import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { HomeContent } from "@/content/types";
import { cn } from "@/lib/utils";

type CaseCardProps = {
  study: HomeContent["cases"]["items"][number];
  labels: Pick<
    HomeContent["cases"],
    "contextLabel" | "highlightsLabel" | "stackLabel" | "outcomeLabel"
  >;
  index: number;
};

const caseThemes = [
  {
    shell:
      "border-[color:var(--border-inverse)] bg-[linear-gradient(160deg,var(--accent-strong),var(--accent)_58%,color-mix(in_srgb,var(--primary)_72%,var(--accent)_28%)_120%)]",
    text: "text-[color:var(--foreground-inverse-muted)]",
    badge:
      "border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse)] text-[color:var(--foreground-inverse-muted)]",
    panel: "border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse)]",
    chips:
      "border-[color:var(--border-inverse)] bg-[color:var(--surface-inverse-strong)] text-[color:var(--foreground-inverse-muted)]",
    detailLabel: "text-[color:var(--foreground-inverse-subtle)]",
    detailValue: "text-[color:var(--foreground-inverse)]",
    icon: "text-[color:var(--foreground-inverse)]",
  },
  {
    shell:
      "border-[color:var(--secondary-border)] bg-[linear-gradient(165deg,var(--surface-elevated),rgba(251,243,234,0.9)_58%,rgba(200,148,90,0.18)_120%)]",
    text: "text-[color:var(--foreground-muted)]",
    badge:
      "border-[color:var(--secondary-border)] bg-[color:var(--secondary-soft)] text-[color:var(--foreground)]",
    panel: "border-[color:var(--border)] bg-[color:rgba(255,255,255,0.68)]",
    chips:
      "border-[color:var(--secondary-border)] bg-[color:rgba(255,255,255,0.76)] text-[color:var(--foreground-soft)]",
    detailLabel: "text-[color:var(--muted)]",
    detailValue: "text-[color:var(--foreground)]",
    icon: "text-[color:var(--foreground)]",
  },
  {
    shell:
      "border-[color:var(--primary-border)] bg-[linear-gradient(165deg,var(--surface-elevated),rgba(240,248,246,0.9)_56%,rgba(19,138,120,0.16)_120%)]",
    text: "text-[color:var(--foreground-muted)]",
    badge:
      "border-[color:var(--primary-border)] bg-[color:var(--primary-soft)] text-[color:var(--primary-strong)]",
    panel: "border-[color:var(--border)] bg-[color:rgba(255,255,255,0.7)]",
    chips:
      "border-[color:var(--primary-border)] bg-[color:var(--primary-soft)] text-[color:var(--primary-strong)]",
    detailLabel: "text-[color:var(--muted)]",
    detailValue: "text-[color:var(--foreground)]",
    icon: "text-[color:var(--foreground)]",
  },
] as const;

export function CaseCard({ study, labels, index }: CaseCardProps) {
  const theme = caseThemes[index % caseThemes.length];
  const previewStack = study.stack.slice(0, 4);

  return (
    <Reveal delay={index * 90}>
      <Card className="group flex h-full flex-col rounded-[34px] border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-elevated),var(--surface))] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:shadow-[var(--shadow-strong)]">
        <div
          className={cn(
            "relative m-2 overflow-hidden rounded-[30px] border p-5 sm:p-6",
            theme.shell,
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_26%)]" />

          <div className="relative space-y-6">
            <div className="flex items-center justify-between gap-4">
              <Badge className={cn("w-fit shadow-none", theme.badge)}>{study.label}</Badge>
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl border transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  theme.panel,
                )}
              >
                <ArrowUpRight className={cn("size-4", theme.icon)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <h3
                  className={cn(
                    "text-3xl font-semibold tracking-[-0.07em]",
                    index === 0 ? "text-[color:var(--foreground-inverse)]" : "text-[color:var(--foreground)]",
                  )}
                >
                  {study.name}
                </h3>
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.24em]",
                    index === 0
                      ? "text-[color:var(--foreground-inverse-subtle)]"
                      : "text-[color:var(--muted)]",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className={cn("max-w-[32rem] text-base leading-7", theme.text)}>
                {study.headline}
              </p>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div className="grid gap-3 sm:grid-cols-3">
                {study.details.map((detail) => (
                  <div
                    key={detail.label}
                    className={cn(
                      "rounded-[24px] border p-4 backdrop-blur-sm",
                      theme.panel,
                    )}
                  >
                    <div className="space-y-2">
                      <span
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-[0.22em]",
                          theme.detailLabel,
                        )}
                      >
                        {detail.label}
                      </span>
                      <p className={cn("text-sm leading-6 font-medium", theme.detailValue)}>
                        {detail.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={cn("rounded-[24px] border p-4 backdrop-blur-sm", theme.panel)}>
                <div className="space-y-3">
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.22em]",
                      theme.detailLabel,
                    )}
                  >
                    {labels.stackLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {previewStack.map((item) => (
                      <span
                        key={item}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[-0.01em]",
                          theme.chips,
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-6 pt-2">
          <article className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {labels.contextLabel}
            </span>
            <p className="text-sm leading-7 text-[color:var(--foreground-soft)]">{study.context}</p>
          </article>

          <article className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {labels.highlightsLabel}
            </span>
            <ul className="space-y-3">
              {study.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex gap-3 text-sm leading-7 text-[color:var(--foreground-soft)]"
                >
                  <span className="mt-2.5 size-2 shrink-0 rounded-full bg-[linear-gradient(180deg,var(--secondary),var(--primary))]" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {labels.stackLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {study.stack.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </article>

          <article className="rounded-[26px] border border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-elevated),color-mix(in_srgb,var(--surface-strong)_84%,var(--secondary-soft)))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                {labels.outcomeLabel}
              </span>
              <p className="text-sm leading-7 text-[color:var(--foreground-soft)]">
                {study.outcome}
              </p>
            </div>
          </article>
        </CardContent>

        <CardFooter className="mt-auto flex flex-wrap gap-3 border-t border-[color:var(--border)] pt-6">
          {study.actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant={action.variant ?? "primary"}
              size="sm"
              className={cn(
                action.variant === "ghost" && "px-0 text-sm shadow-none",
              )}
            >
              <a
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
              >
                {action.label}
              </a>
            </Button>
          ))}
        </CardFooter>
      </Card>
    </Reveal>
  );
}
