import { Badge } from "@/components/ui/badge";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-5xl space-y-6">
      <Badge variant="accent" className="w-fit">
        {eyebrow}
      </Badge>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:items-end xl:gap-8">
        <h2 className="text-balance text-3xl font-semibold tracking-[-0.07em] text-[color:var(--foreground)] sm:text-4xl lg:text-[2.95rem] lg:leading-[1.03]">
          {title}
        </h2>
        <p className="max-w-3xl border-l border-[color:var(--primary-border)] pl-4 text-base leading-8 text-[color:var(--muted-strong)] sm:text-lg xl:pl-6">
          {description}
        </p>
      </div>
    </div>
  );
}
