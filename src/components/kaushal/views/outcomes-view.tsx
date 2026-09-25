"use client";

import * as React from "react";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { PhasePlaceholder } from "@/components/kaushal/phase-placeholder";
import { StatusPill } from "@/components/kaushal/status-pill";

export function OutcomesView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcomes"
        description="Placement, employer satisfaction and feedback — the loop that lets the platform learn from what actually happened."
        badge={<StatusPill tone="attention" dot>Capability not activated in current build phase</StatusPill>}
      />

      <PhasePlaceholder
        title="Outcome Feedback Engine"
        phase="Planned for Phase 12"
        icon={<Target className="size-7" />}
        description="Outcome feedback engine will be introduced in a later phase. It will capture placement outcomes, employer satisfaction, course-effectiveness signals and trainee career pathways — feeding them back into demand intelligence, gap analysis and policy simulation so the platform improves continuously."
        capabilities={[
          { label: "Placement Tracking", detail: "Placement rates by course, district and role." },
          { label: "Employer Satisfaction", detail: "Structured satisfaction signals per cohort." },
          { label: "Course Effectiveness", detail: "Outcomes drive course revision priorities." },
          { label: "Feedback Loop", detail: "Outcomes refine future demand & gap estimates." },
        ]}
      />
    </div>
  );
}
