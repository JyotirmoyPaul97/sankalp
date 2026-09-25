"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Database, ExternalLink } from "lucide-react";
import { StatusPill, dataStatusTone } from "./status-pill";
import type { DataStatus } from "@/types/domain";

interface SourceBadgeProps {
  status: DataStatus;
  label?: string;
  className?: string;
}

export function SourceBadge({ status, label, className }: SourceBadgeProps) {
  const tone = dataStatusTone(status);
  return (
    <StatusPill tone={tone} dot className={className}>
      {label ?? status}
    </StatusPill>
  );
}

interface ProvenanceLineProps {
  source: string;
  status: DataStatus;
  lastUpdated?: string | null;
  href?: string | null;
  className?: string;
}

export function ProvenanceLine({
  source,
  status,
  lastUpdated,
  href,
  className,
}: ProvenanceLineProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Database className="size-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm truncate">{source}</span>
      </div>
      <SourceBadge status={status} />
      {lastUpdated ? (
        <span className="text-[11px] text-muted-foreground">
          Updated {new Date(lastUpdated).toLocaleDateString()}
        </span>
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          <ExternalLink className="size-3" /> Source
        </a>
      ) : null}
    </div>
  );
}
