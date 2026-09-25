"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "./status-pill";

interface EvidencePanelProps {
  title: string;
  children: React.ReactNode;
  source?: string;
  lastUpdated?: string;
  confidence?: "low" | "medium" | "high";
  className?: string;
}

const confidenceTone = {
  low: "attention",
  medium: "info",
  high: "positive",
} as const;

/**
 * Structural component for evidence-driven panels.
 * Visual scaffold for evidence panels; real
 * WHY / EVIDENCE / SOURCE / LAST UPDATED / CONFIDENCE metadata.
 */
export function EvidencePanel({
  title,
  children,
  source,
  lastUpdated,
  confidence,
  className,
}: EvidencePanelProps) {
  return (
    <Card className={cn("shadow-none", className)}>
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b">
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        <div className="flex flex-wrap items-center gap-1.5">
          {source ? (
            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wide">
              {source}
            </Badge>
          ) : null}
          {confidence ? (
            <StatusPill tone={confidenceTone[confidence]} dot>
              {confidence} confidence
            </StatusPill>
          ) : null}
          {lastUpdated ? (
            <span className="text-[10px] text-muted-foreground">{lastUpdated}</span>
          ) : null}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}
