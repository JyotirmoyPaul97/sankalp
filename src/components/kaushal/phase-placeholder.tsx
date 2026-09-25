"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface PhasePlaceholderProps {
  title: string;
  phase: string;
  icon?: React.ReactNode;
  description: React.ReactNode;
  capabilities?: { label: string; detail: string }[];
  className?: string;
}

/**
 * Intelligent empty-state for future-module placeholders.
 * Avoids the lazy "Coming Soon" label; instead explains what the
 * capability will do and in which phase it activates.
 */
export function PhasePlaceholder({
  title,
  phase,
  icon,
  description,
  capabilities,
  className,
}: PhasePlaceholderProps) {
  return (
    <div className={cn("w-full", className)}>
      <Card className="border-dashed bg-muted/30 shadow-none">
        <div className="p-8 md:p-12 flex flex-col items-center text-center gap-5 max-w-2xl mx-auto">
          <div className="rounded-full bg-background border p-4 text-muted-foreground shadow-sm">
            {icon}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-status-attention" />
            {phase}
          </div>
          {capabilities && capabilities.length > 0 ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left mt-2">
              {capabilities.map((c) => (
                <div key={c.label} className="rounded-md border bg-background p-3 space-y-1">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </dt>
                  <dd className="text-xs text-foreground/80 leading-snug">{c.detail}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
