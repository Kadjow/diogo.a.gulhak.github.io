import { Reveal } from "@/components/motion/reveal";
import { CaseCard } from "@/components/site/case-card";
import { SectionHeading } from "@/components/site/section-heading";
import type { HomeContent } from "@/content/types";

type CasesSectionProps = {
  content: HomeContent["cases"];
};

export function CasesSection({ content }: CasesSectionProps) {
  return (
    <section id="cases" className="px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
          />
        </Reveal>

        <div className="grid gap-5 xl:grid-cols-3">
          {content.items.map((study, index) => (
            <CaseCard
              key={study.slug}
              study={study}
              labels={content}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
