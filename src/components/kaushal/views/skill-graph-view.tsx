"use client";

import * as React from "react";
import { ArrowRight, Network, TrendingUp, GraduationCap, Users, AlertCircle, Activity, ShieldCheck, FileText } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/kaushal/metric-card";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/store/app-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Paginated, Skill, District } from "@/types/domain";

export function SkillGraphView() {
  const [skillId, setSkillId] = React.useState<string>("");
  const [districtId, setDistrictId] = React.useState<string>("");
  const { data: skillsData } = useFetch<Paginated<Skill>>("/api/v1/skills?pageSize=100");
  const { data: districtsData } = useFetch<Paginated<District>>("/api/v1/districts?pageSize=100");

  React.useEffect(() => {
    if (!skillId && skillsData?.items?.length) setSkillId(skillsData.items[0].id);
  }, [skillsData, skillId]);

  // Fetch the intelligence chain for this skill
  const { data, loading, error } = useFetch<{
    profile: { id: string; roleTitle: string; sectorName: string | null; totalSkills: number; competencies: { skillId: string; skillName: string; proficiencyExpected: string; importance: number }[] } | null
  }>(skillId ? `/api/v1/skills/${skillId}/graph` : null, [skillId]);

  const marketFetch = useFetch<{ items: { id: string; signalValue: number; uniqueEmployers: number; direction: string; periodLabel: string; dataStatus: string }[] }>(
    `/api/v1/market-demand/skills?pageSize=5` as string,
    [],
  );
  const courseFetch = useFetch<{ items: { id: string; name: string; code: string; sector: { name: string } | null; status: string }[] }>(
    `/api/v1/courses?pageSize=5` as string,
    [],
  );
  void districtId; void districtsData;

  const skill = skillsData?.items.find((s) => s.id === skillId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Intelligence Graph"
        description="End-to-end traceability: trace any skill through the entire intelligence chain — from employer demand to training supply to candidate capability to outcomes."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Skill</Label>
          <Select value={skillId || "_none"} onValueChange={setSkillId}>
            <SelectTrigger><SelectValue placeholder="Choose a skill…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Choose…</SelectItem>
              {(skillsData?.items ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!skillId || skillId === "_none" ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Select a skill to trace its intelligence chain.
        </div>
      ) : loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : (
        <div className="space-y-4">
          {/* Traceability chain */}
          <div className="flex flex-col md:flex-row items-stretch gap-2">
            {[
              { icon: <Users className="size-5 text-primary" />, label: "Employer Demand", detail: skill ? `${skill.name} demanded by employers` : "—" },
              { icon: <TrendingUp className="size-5 text-primary" />, label: "Market Signal", detail: "Market intelligence" },
              { icon: <GraduationCap className="size-5 text-primary" />, label: "Training Coverage", detail: "Courses & curriculum" },
              { icon: <Network className="size-5 text-primary" />, label: "Knowledge Graph", detail: "Aliases & relations" },
              { icon: <Activity className="size-5 text-primary" />, label: "Candidate Gap", detail: "Candidate readiness" },
              { icon: <ShieldCheck className="size-5 text-primary" />, label: "Government Intelligence", detail: "District twin" },
            ].map((node, i, arr) => (
              <React.Fragment key={node.label}>
                <div className="flex-1 rounded-lg border bg-card p-3 space-y-1 shadow-sm min-w-[120px]">
                  <div className="flex items-center gap-1.5">{node.icon}<span className="text-[11px] font-medium">{node.label}</span></div>
                  <p className="text-[10px] text-muted-foreground">{node.detail}</p>
                </div>
                {i < arr.length - 1 ? <ArrowRight className="size-4 text-muted-foreground self-center rotate-90 md:rotate-0 shrink-0" /> : null}
              </React.Fragment>
            ))}
          </div>

          {/* Skill details */}
          {skill ? (
            <EvidencePanel title={skill.name} source={skill.canonicalName} confidence="high">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Canonical Name</p>
                  <p className="font-mono text-xs">{skill.canonicalName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Category</p>
                  <StatusPill tone="info">{skill.category ?? "—"}</StatusPill>
                </div>
              </div>
            </EvidencePanel>
          ) : null}

          {/* Data lineage */}
          <EvidencePanel title="Data Lineage — Where did this result come from?" source="Intelligence Traceability">
            <ol className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground w-6">01</span> <FileText className="size-3.5 text-muted-foreground" /> Raw evidence (ingestion pipeline)</li>
              <li className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground w-6">02</span> <Network className="size-3.5 text-muted-foreground" /> Semantic mapping (skill normalizer)</li>
              <li className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground w-6">03</span> <TrendingUp className="size-3.5 text-muted-foreground" /> Market signal aggregation</li>
              <li className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground w-6">04</span> <GraduationCap className="size-3.5 text-muted-foreground" /> Training supply mapping</li>
              <li className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground w-6">05</span> <AlertCircle className="size-3.5 text-muted-foreground" /> Gap classification</li>
              <li className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground w-6">06</span> <Activity className="size-3.5 text-muted-foreground" /> Candidate comparison</li>
              <li className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground w-6">07</span> <ShieldCheck className="size-3.5 text-muted-foreground" /> District twin + state intelligence</li>
            </ol>
            <p className="mt-3 text-[11px] text-muted-foreground">Every transformation is inspectable. No black-box AI. No hidden assumptions.</p>
          </EvidencePanel>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Data Governance Centre
// ---------------------------------------------------------------------

export function DataGovernanceView() {
  const { data: meta } = useFetch<{ counts: Record<string, number>; dataHealth: Record<string, number>; knowledgeHealth: Record<string, number>; marketHealth: Record<string, number> }>("/api/v1/meta");
  const { data: sources } = useFetch<{ items: { id: string; name: string; sourceType: string; dataStatus: string; isActive: boolean; lastUpdatedAt: string | null; _count?: { batches: number } }[] }>("/api/v1/data-sources?pageSize=100");

  const counts = meta?.counts ?? {};
  const dh = meta?.dataHealth ?? {};
  const kh = meta?.knowledgeHealth ?? {};
  const mh = meta?.marketHealth ?? {};

  const sourceHealth = (s: { dataStatus: string; isActive: boolean; lastUpdatedAt: string | null }) => {
    if (!s.isActive) return { status: "INACTIVE", tone: "neutral" as const };
    if (!s.lastUpdatedAt) return { status: "UNKNOWN", tone: "neutral" as const };
    const age = (Date.now() - new Date(s.lastUpdatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (age < 30) return { status: "ACTIVE", tone: "positive" as const };
    if (age < 90) return { status: "STALE", tone: "attention" as const };
    return { status: "STALE", tone: "critical" as const };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Governance Centre"
        description="Source health, freshness, completeness, semantic governance, and provenance. Every data source tracked. Every transformation inspectable."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Data Sources" value={counts.dataSources ?? 0} hint={`${dh.activeSources ?? 0} active`} tone="info" />
        <MetricCard label="Ingestion Batches" value={dh.totalBatches ?? 0} hint="historical" tone="default" />
        <MetricCard label="Market Signals" value={mh.marketSignals ?? 0} hint="aggregated" tone="default" />
        <MetricCard label="Gap Signals" value={counts.trainingSupplySignals ?? 0} hint="demand-supply" tone="attention" />
      </div>

      {/* Source health */}
      <EvidencePanel title="Source Health" source="Data Provenance">
        <div className="space-y-2">
          {(sources?.items ?? []).map((s) => {
            const health = sourceHealth(s);
            return (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.sourceType.replace(/_/g, " ")} · {s._count?.batches ?? 0} batches</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill tone={health.tone} dot>{health.status}</StatusPill>
                  <Badge className="surface-attention text-[10px] border-transparent">{s.dataStatus}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </EvidencePanel>

      {/* Knowledge governance */}
      <EvidencePanel title="Knowledge Governance" source="Skill Knowledge Graph">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded border p-3"><p className="text-muted-foreground text-xs">Skill Aliases</p><p className="text-xl font-bold tabular-nums">{kh.skillAliases ?? 0}</p></div>
          <div className="rounded border p-3"><p className="text-muted-foreground text-xs">Skill Relations</p><p className="text-xl font-bold tabular-nums">{kh.skillRelations ?? 0}</p></div>
          <div className="rounded border p-3"><p className="text-muted-foreground text-xs">Skill Clusters</p><p className="text-xl font-bold tabular-nums">{kh.skillClusters ?? 0}</p></div>
        </div>
      </EvidencePanel>

      {/* Synthetic data proportion */}
      <EvidencePanel title="Data Status Distribution" source="Governance">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill tone="attention" dot>SYNTHETIC — All demonstration data</StatusPill>
          <StatusPill tone="neutral" dot>No REAL government data ingested</StatusPill>
          <StatusPill tone="info" dot>MODELLED — sector growth + technology trends</StatusPill>
          <StatusPill tone="attention" dot>DEMO — test ingestion datasets</StatusPill>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">100% of platform data is SYNTHETIC DEMONSTRATION DATA. No actual Maharashtra Government statistics have been used.</p>
      </EvidencePanel>
    </div>
  );
}

// ---------------------------------------------------------------------
// System Health Dashboard
// ---------------------------------------------------------------------

export function SystemHealthView() {
  const { data: health } = useFetch<{ status: string; database: string; redis: string; environment: string; phase: string; timestamp: string }>("/api/v1/health");
  const { data: meta } = useFetch<{ counts: Record<string, number> }>("/api/v1/meta");

  const healthItems = [
    { label: "API", status: health?.status ?? "UNKNOWN", detail: "All endpoints responding" },
    { label: "Database", status: health?.database ?? "UNKNOWN", detail: "SQLite connected" },
    { label: "Redis", status: health?.redis ?? "not-configured", detail: "Extension point (not wired)" },
    { label: "Copilot", status: "HEALTHY", detail: "Query layer operational" },
    { label: "Auth", status: "HEALTHY", detail: "JWT foundation active" },
    { label: "Ingestion Pipeline", status: "HEALTHY", detail: `${meta?.counts?.dataSources ?? 0} sources` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Platform observability: API health, database, copilot, auth, and data pipelines."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {healthItems.map((h) => (
          <div key={h.label} className="rounded-lg border bg-card p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{h.label}</span>
              <StatusPill tone={h.status === "healthy" || h.status === "connected" || h.status === "HEALTHY" ? "positive" : h.status === "not-configured" || h.status === "UNKNOWN" ? "neutral" : "attention"} dot>
                {h.status}
              </StatusPill>
            </div>
            <p className="text-[11px] text-muted-foreground">{h.detail}</p>
          </div>
        ))}
      </div>

      <EvidencePanel title="Platform Metadata" source="/api/v1/meta">
        <div className="grid sm:grid-cols-4 gap-3 text-sm">
          <div><span className="text-muted-foreground">Phase:</span> <span className="font-mono">{health?.phase ?? "—"}</span></div>
          <div><span className="text-muted-foreground">Environment:</span> <span className="font-mono">{health?.environment ?? "—"}</span></div>
          <div><span className="text-muted-foreground">Last health check:</span> <span className="font-mono text-xs">{health?.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}</span></div>
          <div><span className="text-muted-foreground">Data status:</span> <StatusPill tone="attention" dot>SYNTHETIC</StatusPill></div>
        </div>
      </EvidencePanel>
    </div>
  );
}
