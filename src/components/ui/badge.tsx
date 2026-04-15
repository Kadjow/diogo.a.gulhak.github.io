import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--muted-strong)]",
        accent:
          "border-[color:var(--primary-border)] bg-[color:var(--primary-soft)] text-[color:var(--primary-strong)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
