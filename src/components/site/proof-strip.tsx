import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { HomeContent } from "@/content/types";

type ProofStripProps = {
  content: HomeContent["proofStrip"];
};

export function ProofStrip({ content }: ProofStripProps) {
  return (
    <section className="px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-5">
        <Reveal>
          <Badge className="w-fit">{content.eyebrow}</Badge>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 80}>
              <Card className="rounded-[28px] border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-elevated),var(--surface))] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:shadow-[var(--shadow-medium)]">
                <CardContent className="space-y-5 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      0{index + 1}
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-2xl border border-[color:var(--primary-border)] bg-[color:var(--primary-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <ArrowUpRight className="size-4 text-[color:var(--primary-strong)]" />
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-[-0.05em] text-[color:var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
                      {item.description}
                    </p>
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
