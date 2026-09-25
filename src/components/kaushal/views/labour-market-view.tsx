"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { PhasePlaceholder } from "@/components/kaushal/phase-placeholder";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useFetch } from "@/hooks/use-fetch";
import type { PlatformMeta } from "@/types/domain";

export function LabourMarketView() {
  const { data: meta } = useFetch<PlatformMeta>("/api/v1/meta");
  const phaseInfo = meta?.phases.find((p) => p.id === "labour-market");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Labour Market"
        description="Demand signals by role, skill, location and proficiency — sourced from job postings, employer surveys, sector growth and placement outcomes."
        badge={<StatusPill tone="attention" dot>Capability not activated in current build phase</StatusPill>}
      />

      <PhasePlaceholder
        title="Labour-Market Intelligence Engine"
        phase="Planned for Phase 4"
        icon={<TrendingUp className="size-7" />}
        description="Labour-market intelligence will be introduced in Phase 4. It will ingest job-posting signals, employer surveys, industry consultations, sector growth data, placement outcomes and emerging-technology trends — and translate them into demand by role, skill, location and proficiency level."
        capabilities={[
          { label: "Demand Signals", detail: "Job postings, employer surveys, sector growth, tech trends." },
          { label: "Demand Profiling", detail: "By role, skill, location and proficiency level." },
          { label: "Employer Demand", detail: "Structured employer-validation workflows (Phase 7)." },
          { label: "Placement Outcomes", detail: "Outcome feedback feeding back into demand (Phase 12)." },
        ]}
      />
      {phaseInfo ? (
        <p className="text-[11px] text-muted-foreground text-center">
          Module registered in platform meta as <span className="font-mono">phase {phaseInfo.phase}</span>.
        </p>
      ) : null}
    </div>
  );
}
