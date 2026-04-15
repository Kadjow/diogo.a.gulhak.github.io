"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  priority?: boolean;
};

export function Reveal({ children, className, delay = 0, priority = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(priority);

  const revealNode = useEffectEvent((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];

    if (entry?.isIntersecting) {
      setIsVisible(true);
    }
  });

  useEffect(() => {
    if (priority) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(revealNode, {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.18,
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-transform transition-[opacity,transform,filter] duration-[640ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        isVisible ? "translate-y-0 opacity-100 blur-0" : "translate-y-5 opacity-0 blur-[4px]",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
