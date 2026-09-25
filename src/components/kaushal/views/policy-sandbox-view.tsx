"use client";

import * as React from "react";
import { FlaskConical, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { StatusPill } from "@/components/kaushal/status-pill";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusBadge } from "@/components/kaushal/visual-components";
import { ScenarioComparison } from "@/components/kaushal/visual-components";
import { useFetch } from "@/hooks/use-fetch";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { LoadingState } from "@/components/kaushal/states";

export function PolicySandboxView() {
  const { data, loading } = useFetch<{ scenarios: { id: string; name: string; description: string | null; status: string; district: { name: string }; _count: { results: number; interventions: number; assumptions: number } }[] }>("/api/v1/scenarios");

  const cols: Column<{ id: string; name: string; description: string | null; status: string; district: { name: string }; _count: { results: number; interventions: number; assumptions: number } }>[] = [
    { key: "name", header: "Scenario", cell: (s) => <div><p className="text-sm font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{s.district.name}</p></div> },
    { key: "status", header: "Status", cell: (s) => <StatusPill tone={s.status === "SIMULATED" ? "positive" : "neutral"} dot>{s.status}</StatusPill>, width: "120px" },
    { key: "interventions", header: "Interventions", cell: (s) => <span className="tabular-nums text-sm">{s._count.interventions}</span>, width: "110px" },
    { key: "assumptions", header: "Assumptions", cell: (s) => <span className="tabular-nums text-sm">{s._count.assumptions}</span>, width: "100px" },
    { key: "results", header: "Results", cell: (s) => <span className="tabular-nums text-sm">{s._count.results}</span>, width: "80px" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Sandbox"
        description="Create scenarios, configure interventions, simulate impacts, compare alternatives. SIMULATED RESULTS — NOT FORECASTS."
        badge={<StatusBadge status="SIMULATED" />}
      />

      {/* Simulation warning */}
      <div className="rounded-md border border-status-attention/30 bg-status-attention/5 px-4 py-3 text-sm text-foreground/80 flex items-start gap-3">
        <AlertTriangle className="size-4 text-status-attention mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">All scenario results are SIMULATED.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Baseline + explicit intervention + transparent rule = simulated state. NOT a forecast. NOT a guarantee.</p>
        </div>
      </div>

      {/* Example scenario comparison */}
      <ScenarioComparison metrics={[
        { label: "Training Capacity", baseline: "210", simulated: "310", unit: "seats" },
        { label: "Coverage", baseline: "Partial", simulated: "Improved" },
        { label: "Proficiency", baseline: "Medium", simulated: "Higher" },
        { label: "Gap Signal", baseline: "Moderate", simulated: "Lower" },
      ]} />

      {/* Scenario table */}
      {loading ? <LoadingState /> : (
        <EvidencePanel title="Policy Scenarios" source="Scenario Engine">
          <DataTable columns={cols} rows={data?.scenarios ?? []} rowKey={(s) => s.id} emptyMessage="No scenarios created yet." />
        </EvidencePanel>
      )}
    </div>
  );
}
