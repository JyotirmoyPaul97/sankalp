"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { PhasePlaceholder } from "@/components/kaushal/phase-placeholder";
import { StatusPill } from "@/components/kaushal/status-pill";

export function EmployerValidationView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employer Validation"
        description="Structured workflows for employers to validate role-skill demand, proficiency expectations and candidate readiness."
        badge={<StatusPill tone="attention" dot>Capability not activated in current build phase</StatusPill>}
      />

      <PhasePlaceholder
        title="Employer Validation Workflow"
        phase="Planned for Phase 7"
        icon={<ShieldCheck className="size-7" />}
        description="Employer validation workflow will be activated in a later phase. It will let registered employers confirm or refine the skills, proficiency levels and job roles the platform has inferred from demand signals — closing the loop between evidence and employer expectations."
        capabilities={[
          { label: "Demand Confirmation", detail: "Employers confirm/refine inferred role-skill demand." },
          { label: "Proficiency Levels", detail: "Validate expected proficiency per skill per role." },
          { label: "Candidate Readiness", detail: "Flag job-ready candidates against employer criteria." },
          { label: "Audit Trail", detail: "Traceable validation history per employer per role." },
        ]}
      />
    </div>
  );
}
