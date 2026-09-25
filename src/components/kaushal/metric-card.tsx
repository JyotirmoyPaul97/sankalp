"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "info" | "positive" | "attention" | "critical";
  loading?: boolean;
  className?: string;
}

const toneRing: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "",
  info: "border-l-4 border-l-[var(--status-info)]",
  positive: "border-l-4 border-l-[var(--status-positive)]",
  attention: "border-l-4 border-l-[var(--status-attention)]",
  critical: "border-l-4 border-l-[var(--status-critical)]",
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  loading,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("p-5 gap-1 shadow-none", toneRing[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {value}
            </p>
          )}
          {hint ? (
            <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="shrink-0 rounded-md bg-muted p-2 text-muted-foreground">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
