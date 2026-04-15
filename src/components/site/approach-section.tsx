import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import type { HomeContent } from "@/content/types";

type ApproachSectionProps = {
  content: HomeContent["approach"];
};

export function ApproachSection({ content }: ApproachSectionProps) {
  return (
    <section id="como-atuo" className="px-6 py-16 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Reveal className="space-y-8">
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
          />

          <div className="grid gap-4">
            {content.principles.map((item, index) => (
              <Reveal key={item.title} delay={index * 90}>
                <Card className="rounded-[30px] border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-elevated),var(--surface))] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:shadow-[var(--shadow-medium)]">
                  <CardContent className="space-y-3 pt-6">
                    <div className="h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,var(--secondary),var(--primary))]" />
                    <h3 className="text-lg font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <Card className="rounded-[36px] border-[color:var(--border-strong)] bg-[linear-gradient(180deg,var(--surface-elevated),color-mix(in_srgb,var(--surface-strong)_82%,var(--secondary-soft)))] shadow-[var(--shadow-medium)]">
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  {content.experienceEyebrow}
                </span>
                <h3 className="text-2xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[2rem]">
                  {content.experienceTitle}
                </h3>
              </div>

              <div className="space-y-6">
                {content.experienceItems.map((item, index) => (
                  <div
                    key={`${item.company}-${item.role}`}
                    className={
                      index === content.experienceItems.length - 1
                        ? "space-y-3"
                        : "space-y-3 border-b border-[color:var(--border)] pb-6"
                    }
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <h4 className="text-lg font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
                          {item.role}
                        </h4>
                        <p className="text-sm text-[color:var(--muted)]">{item.company}</p>
                      </div>
                      <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1 text-xs font-medium text-[color:var(--muted-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        {item.period}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-[color:var(--foreground-soft)]">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
