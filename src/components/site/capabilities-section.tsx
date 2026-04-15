import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { HomeContent } from "@/content/types";

type CapabilitiesSectionProps = {
  content: HomeContent["capabilities"];
};

export function CapabilitiesSection({ content }: CapabilitiesSectionProps) {
  return (
    <section id="capabilities" className="px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
          />
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {content.groups.map((group, index) => (
            <Reveal key={group.title} delay={index * 80}>
              <Card className="rounded-[30px] border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-elevated),var(--surface))] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:shadow-[var(--shadow-medium)]">
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-3">
                    <div className="h-1.5 w-14 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--primary))]" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
                        {group.title}
                      </h3>
                      <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <Badge key={item}>{item}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
