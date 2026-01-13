"use client";

import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  label: string
  status: string
  value: number // 0-100 representing position within range
  color: "teal" | "blue" | "amber" | "slate"
}

const colorMap = {
  teal: {
    ring: "stroke-chart-2",
    fill: "text-chart-2",
    bg: "bg-chart-2/10",
  },
  blue: {
    ring: "stroke-chart-1",
    fill: "text-chart-1",
    bg: "bg-chart-1/10",
  },
  amber: {
    ring: "stroke-chart-3",
    fill: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  slate: {
    ring: "stroke-chart-4",
    fill: "text-chart-4",
    bg: "bg-chart-4/10",
  },
};

export function StatusIndicator({ label, status, value, color }: StatusIndicatorProps) {
  const colors = colorMap[color];
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border">
      <div className="relative">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-secondary" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(colors.ring, "transition-all duration-1000")}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        <div className={cn("absolute inset-0 flex items-center justify-center")}>
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", colors.bg)}>
            <div className={cn("w-3 h-3 rounded-full", colors.fill.replace("text-", "bg-"))} />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{status}</p>
      </div>
    </div>
  );
}
