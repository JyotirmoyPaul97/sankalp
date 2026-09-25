"use client";

import * as React from "react";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { PhasePlaceholder } from "@/components/kaushal/phase-placeholder";
import { StatusPill } from "@/components/kaushal/status-pill";

export function DistrictPlansView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="District Plans"
        description="Generate evidence-driven district-level skill-development action plans from demand-supply intelligence."
        badge={<StatusPill tone="attention" dot>Capability not activated in current build phase</StatusPill>}
      />

      <PhasePlaceholder
        title="District Action Plan Generation"
        phase="Planned for Phase 9"
        icon={<ClipboardList className="size-7" />}
        description="District action-plan generation will be introduced in a later phase. It will combine demand intelligence, supply capacity, gap analysis and policy simulation to produce prioritised, district-specific plans — including course launches, capacity expansion, trainer development and equipment planning."
        capabilities={[
          { label: "Prioritised Actions", detail: "Ranked interventions per district by impact and effort." },
          { label: "Capacity Planning", detail: "Trainer, equipment and seat-capacity recommendations." },
          { label: "Curriculum Signals", detail: "Flag obsolete / oversupplied courses for review." },
          { label: "Implementation Handoff", detail: "Plans flow into execution and outcome tracking." },
        ]}
      />
    </div>
  );
}
