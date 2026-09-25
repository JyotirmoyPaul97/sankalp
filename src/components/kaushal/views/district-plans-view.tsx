"use client";

import * as React from "react";
import { ClipboardList, ArrowRight, Target, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { StatusBadge, ConfidenceBadge } from "@/components/kaushal/visual-components";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { LoadingState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";

interface DistrictPlan {
  id: string;
  district: { name: string };
  planningPeriod: string;
  status: string;
  priorityDomain: string | null;
  objectives: string | null;
  evidenceSummary: string | null;
  _count: { interventions: number };
}

export function DistrictPlansView() {
  const { data, loading } = useFetch<{ items: DistrictPlan[]; total: number }>("/api/v1/district-plans?pageSize=20");

  const cols: Column<DistrictPlan>[] = [
    { key: "district", header: "District", cell: (p) => <span className="text-sm font-medium">{p.district.name}</span> },
    { key: "period", header: "Period", cell: (p) => <span className="text-xs font-mono">{p.planningPeriod}</span>, width: "100px" },
    { key: "domain", header: "Priority Domain", cell: (p) => <span className="text-xs">{p.priorityDomain ?? "—"}</span>, width: "180px" },
    { key: "status", header: "Status", cell: (p) => <StatusPill tone={p.status === "ACTIVE" ? "positive" : p.status === "DRAFT" ? "neutral" : "info"} dot>{p.status}</StatusPill>, width: "120px" },
    { key: "interventions", header: "Interventions", cell: (p) => <span className="tabular-nums text-sm">{p._count.interventions}</span>, width: "110px" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Skill Plans"
        description="Evidence-driven district-level skill-development action plans linked to demand-supply intelligence and policy scenarios."
        badge={<StatusBadge status="SYNTHETIC" />}
      />

      {/* Plan summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Plans</p>
          <p className="text-2xl font-bold tabular-nums">{data?.total ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
          <p className="text-2xl font-bold tabular-nums text-status-positive">{(data?.items ?? []).filter(p => p.status === "ACTIVE").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Draft</p>
          <p className="text-2xl font-bold tabular-nums">{(data?.items ?? []).filter(p => p.status === "DRAFT").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Interventions</p>
          <p className="text-2xl font-bold tabular-nums">{(data?.items ?? []).reduce((s, p) => s + p._count.interventions, 0)}</p>
        </div>
      </div>

      {/* Evidence-linked planning explanation */}
      <EvidencePanel title="Evidence-Linked Planning" source="District Intelligence" confidence="high">
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Each district plan links to market evidence, training capacity, gap intelligence, and policy scenarios.
          Plans capture observed issues, objectives, baseline metrics, and expected indicators — not automatic government recommendations.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill tone="info" dot>Market Evidence</StatusPill>
          <StatusPill tone="info" dot>Training Supply</StatusPill>
          <StatusPill tone="info" dot>Gap Intelligence</StatusPill>
          <StatusPill tone="info" dot>Capability Assessment</StatusPill>
          <StatusPill tone="info" dot>Scenario Linkage</StatusPill>
        </div>
      </EvidencePanel>

      {/* Plans table */}
      <section className="space-y-3">
        <SectionLabel>District Plans</SectionLabel>
        {loading ? <LoadingState /> : (
          <DataTable columns={cols} rows={data?.items ?? []} rowKey={(p) => p.id} emptyMessage="No district plans created yet. Use the Policy Sandbox to create scenarios that can be linked to plans." />
        )}
      </section>
    </div>
  );
}
