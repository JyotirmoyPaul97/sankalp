"use client";

import * as React from "react";
import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { PhasePlaceholder } from "@/components/kaushal/phase-placeholder";
import { StatusPill } from "@/components/kaushal/status-pill";

export function PolicySandboxView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Sandbox"
        description="Simulate policy interventions before implementation — compare options, project outcomes, and de-risk decisions."
        badge={<StatusPill tone="attention" dot>Premium — Capability not activated</StatusPill>}
      />

      <PhasePlaceholder
        title="Policy Simulation Engine"
        phase="Planned for Phase 11"
        icon={<FlaskConical className="size-7" />}
        description="The Policy Simulation Engine will let planners model the likely impact of interventions — new course launches, capacity expansion, trainer development, curriculum revision — and compare Option A vs. Option B before committing resources. No simulation is performed in Phase 1; this is an intentional premium capability reserved for a later phase."
        capabilities={[
          { label: "Scenario Modelling", detail: "Define interventions (courses, capacity, trainers, curriculum)." },
          { label: "Comparative Projection", detail: "Project demand-supply outcomes for Option A vs. Option B." },
          { label: "Sensitivity Analysis", detail: "Understand which assumptions drive the result." },
          { label: "Decision Audit Trail", detail: "Record rationale, evidence and confidence per decision." },
        ]}
      />
    </div>
  );
}
