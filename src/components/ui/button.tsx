import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-semibold tracking-[-0.01em] transition-[transform,box-shadow,border-color,background-color,color,opacity] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:relative [&_svg]:z-[1] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-[280ms] [&_svg]:ease-[cubic-bezier(0.22,1,0.36,1)] hover:[&_svg]:translate-x-0.5",
  {
    variants: {
      variant: {
        primary:
          "isolate overflow-hidden border-[color:var(--primary)] bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-strong)_100%)] px-5 py-3 text-[color:var(--primary-foreground)] shadow-[var(--shadow-button)] before:absolute before:inset-[1px] before:rounded-full before:bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent_58%)] before:content-[''] after:absolute after:inset-x-6 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)] after:content-[''] hover:-translate-y-0.5 hover:border-[color:var(--primary-strong)] hover:bg-[linear-gradient(135deg,var(--primary-strong)_0%,color-mix(in_srgb,var(--primary)_84%,var(--accent)_16%)_100%)] hover:shadow-[var(--shadow-button-strong)]",
        secondary:
          "border-[color:var(--border-strong)] bg-[color:var(--surface-elevated)] px-5 py-3 text-[color:var(--foreground)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color:var(--primary-border)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)] hover:shadow-[var(--shadow-medium)]",
        ghost:
          "border-[color:transparent] bg-transparent px-0 py-0 text-[color:var(--foreground-soft)] shadow-none hover:text-[color:var(--primary-strong)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 text-[0.92rem]",
        lg: "h-13 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
