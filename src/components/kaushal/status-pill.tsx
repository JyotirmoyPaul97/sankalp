"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Tone = "positive" | "attention" | "critical" | "info" | "neutral";

const toneClass: Record<Tone, string> = {
  positive: "surface-positive border-transparent",
  attention: "surface-attention border-transparent",
  critical: "surface-critical border-transparent",
  info: "surface-info border-transparent",
  neutral: "surface-neutral border-transparent",
};

interface StatusPillProps {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

export function StatusPill({ children, tone = "neutral", dot = false, className }: StatusPillProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium rounded-full px-2 py-0.5 text-[11px]", toneClass[tone], className)}
    >
      {dot ? (
        <span
          className={cn(
            "inline-block size-1.5 rounded-full",
            tone === "positive" && "bg-status-positive",
            tone === "attention" && "bg-status-attention",
            tone === "critical" && "bg-status-critical",
            tone === "info" && "bg-status-info",
            tone === "neutral" && "bg-muted-foreground",
          )}
        />
      ) : null}
      {children}
    </Badge>
  );
}

/** Map a data_status value to a tone + label. */
export function dataStatusTone(status: string): Tone {
  switch (status) {
    case "REAL":
      return "positive";
    case "SYNTHETIC":
    case "MODELLED":
      return "info";
    case "DEMO":
      return "attention";
    default:
      return "neutral";
  }
}

export function courseStatusTone(status: string): Tone {
  switch (status) {
    case "ACTIVE":
      return "positive";
    case "UNDER_REVIEW":
      return "attention";
    case "DEPRECATED":
      return "critical";
    case "DRAFT":
      return "neutral";
    default:
      return "neutral";
  }
}
