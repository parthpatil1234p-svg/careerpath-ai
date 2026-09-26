"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StatsCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function StatsCounter({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: StatsCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span
      ref={ref}
      className={cn(
        "tabular-nums font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent",
        className
      )}
      aria-label={`${prefix}${value}${suffix}`}
    >
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default StatsCounter;
