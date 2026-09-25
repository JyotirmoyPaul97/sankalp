"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface FlowNode {
  label: string;
  caption?: string;
}

interface ArchitectureFlowProps {
  nodes: FlowNode[];
  className?: string;
}

/**
 * Conceptual preview of the KAUSHAL DRISHTI intelligence architecture.
 * Purely illustrative in Phase 1 — no live data flows through it yet.
 */
export function ArchitectureFlow({ nodes, className }: ArchitectureFlowProps) {
  return (
    <div className={cn("flex flex-col items-stretch gap-2", className)}>
      {nodes.map((n, i) => (
        <React.Fragment key={n.label}>
          <div className="rounded-md border bg-card px-4 py-3 flex items-center justify-between shadow-none">
            <div>
              <p className="text-sm font-medium">{n.label}</p>
              {n.caption ? (
                <p className="text-[11px] text-muted-foreground">{n.caption}</p>
              ) : null}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          {i < nodes.length - 1 ? (
            <div className="flex justify-center">
              <ArrowRight className="size-4 rotate-90 text-muted-foreground/60" />
            </div>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}
