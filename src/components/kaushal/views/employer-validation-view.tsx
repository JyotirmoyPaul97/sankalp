"use client";

import * as React from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, ArrowRight, Users, TrendingUp, FileText } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { StatusPill } from "@/components/kaushal/status-pill";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { MetricCard } from "@/components/kaushal/metric-card";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { Button } from "@/components/ui/button";
import type { Paginated, JobRole, Skill } from "@/types/domain";

interface ValidationItem {
  skill: string;
  demandSignal: string;
  requiredProficiency: string;
  employerCount: number;
  evidenceCount: number;
  status: "PENDING" | "CONFIRMED" | "MODIFIED" | "REJECTED";
}

const DEMAND_ITEMS: ValidationItem[] = [
  { skill: "PLC Programming", demandSignal: "HIGH", requiredProficiency: "EXPERT", employerCount: 38, evidenceCount: 214, status: "CONFIRMED" },
  { skill: "SCADA", demandSignal: "HIGH", requiredProficiency: "PROFICIENT", employerCount: 32, evidenceCount: 186, status: "CONFIRMED" },
  { skill: "Industrial IoT", demandSignal: "HIGH", requiredProficiency: "PROFICIENT", employerCount: 24, evidenceCount: 98, status: "PENDING" },
  { skill: "Industrial Safety", demandSignal: "MEDIUM", requiredProficiency: "WORKING", employerCount: 28, evidenceCount: 156, status: "CONFIRMED" },
  { skill: "Industrial Robotics", demandSignal: "HIGH", requiredProficiency: "PROFICIENT", employerCount: 22, evidenceCount: 87, status: "MODIFIED" },
  { skill: "Python", demandSignal: "MEDIUM", requiredProficiency: "WORKING", employerCount: 18, evidenceCount: 65, status: "PENDING" },
];

export function EmployerValidationView() {
  const { data: rolesData } = useFetch<Paginated<JobRole>>("/api/v1/job-roles?pageSize=100");
  const [selectedRole, setSelectedRole] = React.useState<string>("");

  React.useEffect(() => {
    if (!selectedRole && rolesData?.items?.length) {
      const plcRole = rolesData.items.find(r => r.title.includes("PLC") || r.title.includes("Automation"));
      setSelectedRole(plcRole?.id ?? rolesData.items[0].id);
    }
  }, [rolesData, selectedRole]);

  const selectedRoleObj = rolesData?.items?.find(r => r.id === selectedRole);
  const confirmedCount = DEMAND_ITEMS.filter(i => i.status === "CONFIRMED").length;
  const pendingCount = DEMAND_ITEMS.filter(i => i.status === "PENDING").length;
  const modifiedCount = DEMAND_ITEMS.filter(i => i.status === "MODIFIED").length;

  const cols: Column<ValidationItem>[] = [
    { key: "skill", header: "Skill", cell: (i) => <span className="text-sm font-medium">{i.skill}</span> },
    { key: "demand", header: "Demand Signal", cell: (i) => <StatusPill tone={i.demandSignal === "HIGH" ? "attention" : "info"} dot>{i.demandSignal}</StatusPill>, width: "120px" },
    { key: "proficiency", header: "Required Proficiency", cell: (i) => <StatusPill tone={i.requiredProficiency === "EXPERT" ? "attention" : "info"}>{i.requiredProficiency}</StatusPill>, width: "150px" },
    { key: "employers", header: "Employers", cell: (i) => <span className="tabular-nums text-sm">{i.employerCount}</span>, width: "90px" },
    { key: "evidence", header: "Evidence", cell: (i) => <span className="tabular-nums text-sm">{i.evidenceCount}</span>, width: "80px" },
    { key: "status", header: "Validation Status", cell: (i) => {
      const tone = i.status === "CONFIRMED" ? "positive" : i.status === "PENDING" ? "attention" : i.status === "MODIFIED" ? "info" : "critical";
      const icon = i.status === "CONFIRMED" ? <CheckCircle2 className="size-3" /> : i.status === "REJECTED" ? <XCircle className="size-3" /> : <AlertCircle className="size-3" />;
      return <StatusPill tone={tone} dot>{icon}{i.status}</StatusPill>;
    }, width: "140px" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employer Validation"
        description="Validate role-skill demand signals, proficiency expectations, and employer consensus. Confirmed validations flow back into the shared Market Intelligence layer."
        badge={<StatusPill tone="info" dot>Active Workflow</StatusPill>}
      />

      {/* Validation summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Confirmed" value={confirmedCount} tone="positive" icon={<CheckCircle2 className="size-4" />} />
        <MetricCard label="Pending" value={pendingCount} tone="attention" icon={<AlertCircle className="size-4" />} />
        <MetricCard label="Modified" value={modifiedCount} tone="info" icon={<FileText className="size-4" />} />
        <MetricCard label="Total Skills" value={DEMAND_ITEMS.length} tone="default" icon={<Users className="size-4" />} />
      </div>

      {/* Demand validation table */}
      <EvidencePanel title="Demand Signal Validation — PLC Technician" source="Employer Demand" confidence="high">
        <p className="text-xs text-muted-foreground mb-3">
          The following skills have been detected from employer demand signals. Employers can confirm, modify, or reject each requirement. Confirmed signals strengthen the market intelligence confidence.
        </p>
        <DataTable columns={cols} rows={DEMAND_ITEMS} rowKey={(i) => i.skill} emptyMessage="No validation items." />
      </EvidencePanel>

      {/* Example validation flow */}
      <EvidencePanel title="Example: PLC Programming Validation" source="Employer Consensus" confidence="high">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <span className="font-medium">Intelligence Layer Output:</span>
            <StatusPill tone="attention" dot>HIGH demand signal</StatusPill>
          </div>
          <div className="pl-6 text-xs text-muted-foreground space-y-1">
            <p>• Detected from: 38 employers, 214 job-posting signals</p>
            <p>• Required proficiency: EXPERT (inferred from job descriptions)</p>
            <p>• District coverage: 10 districts</p>
            <p>• Confidence: HIGH</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <ShieldCheck className="size-4 text-status-positive" />
            <span className="font-medium">Employer Response:</span>
            <StatusPill tone="positive" dot>CONFIRMED</StatusPill>
          </div>
          <div className="pl-6 text-xs text-muted-foreground space-y-1">
            <p>• Employer confirmed PLC Programming is mandatory for PLC Technician role</p>
            <p>• Employer confirmed EXPERT proficiency is required</p>
            <p>• Hiring volume: 25 positions in Pune district</p>
            <p>• Validation timestamp recorded in audit log</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <CheckCircle2 className="size-4 text-status-positive" />
            <span className="font-medium">Result:</span>
            <span className="text-xs">Verified demand signal flowing back into Market Intelligence with elevated confidence.</span>
          </div>
        </div>
      </EvidencePanel>

      {/* Industry / Cluster consultation */}
      <EvidencePanel title="Industry / Cluster Consultation" source="Advanced Manufacturing Cluster — Pune" confidence="medium">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Industrial IoT</span>
            <div className="flex items-center gap-2">
              <StatusPill tone="attention" dot>High consensus</StatusPill>
              <span className="text-xs text-muted-foreground">24 employers</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">PLC Programming</span>
            <div className="flex items-center gap-2">
              <StatusPill tone="attention" dot>High consensus</StatusPill>
              <span className="text-xs text-muted-foreground">38 employers</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Industrial Robotics</span>
            <div className="flex items-center gap-2">
              <StatusPill tone="attention" dot>High consensus</StatusPill>
              <span className="text-xs text-muted-foreground">22 employers</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Battery Management Systems</span>
            <div className="flex items-center gap-2">
              <StatusPill tone="info" dot>Emerging signal</StatusPill>
              <span className="text-xs text-muted-foreground">12 employers</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground pt-2 border-t">Collective industry demand feeds the same Market Intelligence layer as employer-specific demand. Both contribute to shared evidence.</p>
        </div>
      </EvidencePanel>
    </div>
  );
}
