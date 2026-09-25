"use client";

import * as React from "react";
import { Building2, FlaskConical, Activity, AlertTriangle, CheckCircle2, ArrowRight, Target, Gauge, TrendingUp, GraduationCap, Users } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { DistrictTwinVisual, StatusBadge, ConfidenceBadge, VisualBar } from "@/components/kaushal/visual-components";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/store/app-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Paginated, District } from "@/types/domain";

const READINESS_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  READY: "positive", COURSE_DELIVERY_READY: "positive", COMPLETED: "positive",
  PARTIALLY_READY: "attention", PARTIALLY_OPERATIONAL: "attention", IN_PROGRESS: "info",
  LIMITED_READINESS: "critical", PLANNED: "neutral", DRAFT: "neutral",
};
const ALERT_TONE: Record<string, "positive" | "info" | "attention" | "critical"> = {
  INFO: "info", NOTICE: "info", WARNING: "attention", CRITICAL: "critical",
};

export function DistrictTwinView() {
  const setActiveView = useNav((s) => s.setActiveView);
  const [districtId, setDistrictId] = React.useState<string>("");
  const { data: districtsData } = useFetch<Paginated<District>>("/api/v1/districts?pageSize=100");

  React.useEffect(() => {
    if (!districtId && districtsData?.items?.length) setDistrictId(districtsData.items[0].id);
  }, [districtsData, districtId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Skill Digital Twin"
        description="A continuously updated evidence-based view of the district skill ecosystem — market, training, capability, candidates, outcomes, and gaps. All values from existing system data."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="space-y-2 max-w-sm">
        <Label>District</Label>
        <Select value={districtId || "_none"} onValueChange={setDistrictId}>
          <SelectTrigger><SelectValue placeholder="Choose a district…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Choose a district…</SelectItem>
            {(districtsData?.items ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {districtId && districtId !== "_none" ? <TwinDashboard districtId={districtId} /> : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Select a district to view its skill digital twin.
        </div>
      )}
    </div>
  );
}

function TwinDashboard({ districtId }: { districtId: string }) {
  const { data, loading, error } = useFetch<Record<string, unknown>>(`/api/v1/district-twin/${districtId}`);
  const outcomesFetch = useFetch<{ interventions: unknown[]; alerts: { id: string; alertType: string; severity: string; evidence: string | null; status: string; timestamp: string }[] }>(`/api/v1/district-outcomes/${districtId}`);

  if (loading) return <LoadingState label="Building district twin…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!data || Object.keys(data).length === 0) return <ErrorState title="Twin not available" />;

  const twin = data as {
    district: { name: string; division: string | null };
    observationPeriod: string;
    market: { topSkills: { name: string; signal: number }[]; topRoles: { name: string; signal: number }[]; emergingSkills: { name: string; status: string }[]; sectorGrowth: { sector: string; growth: number | null }[] };
    training: { institutions: number; centres: number; plannedCapacity: number; enrolled: number; completed: number; certified: number; courseOfferings: number };
    capability: { readyCourses: number; partiallyReadyCourses: number; limitedReadinessCourses: number; totalDeliveryGaps: number };
    gaps: { highGapCount: number; moderateGapCount: number; proficiencyMismatchCount: number; coveredCount: number; totalGaps: number };
    candidates: { totalCandidates: number; highReadiness: number; moderateReadiness: number; developing: number };
    outcomes: { placementRecords: number };
    confidence: number;
    freshness: string;
    dataStatus: string;
  };

  return (
    <div className="space-y-6">
      {/* District Digital Twin Visual */}
      <DistrictTwinVisual
        district={twin.district.name}
        layers={[
          { label: "Market", icon: <TrendingUp className="size-4" />, items: [
            { label: "Top skills", value: twin.market.topSkills.length, tone: "positive" },
            { label: "Emerging", value: twin.market.emergingSkills.length },
            { label: "Sector growth", value: twin.market.sectorGrowth.length },
          ]},
          { label: "Training", icon: <GraduationCap className="size-4" />, items: [
            { label: "Institutions", value: twin.training.institutions },
            { label: "Centres", value: twin.training.centres },
            { label: "Capacity", value: twin.training.plannedCapacity, tone: "attention" },
          ]},
          { label: "People", icon: <Users className="size-4" />, items: [
            { label: "Candidates", value: twin.candidates.totalCandidates },
            { label: "High readiness", value: twin.candidates.highReadiness, tone: "positive" },
            { label: "Developing", value: twin.candidates.developing, tone: "attention" },
          ]},
        ]}
      />

      {/* Twin header */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <h3 className="text-lg font-semibold">{twin.district.name}</h3>
          <p className="text-xs text-muted-foreground">{twin.district.division ?? "—"} · Observation: {twin.observationPeriod}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={twin.confidence >= 0.6 ? "positive" : twin.confidence >= 0.4 ? "info" : "attention"} dot>Confidence: {Math.round(twin.confidence * 100)}%</StatusPill>
          <StatusPill tone="attention" dot>{twin.dataStatus}</StatusPill>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Institutions" value={twin.training.institutions} tone="default" />
        <MetricCard label="Centres" value={twin.training.centres} tone="default" />
        <MetricCard label="Planned Capacity" value={twin.training.plannedCapacity} hint="seats" tone="info" />
        <MetricCard label="High Gaps" value={twin.gaps.highGapCount} tone={twin.gaps.highGapCount > 0 ? "critical" : "positive"} />
        <MetricCard label="Candidates" value={twin.candidates.totalCandidates} tone="default" />
      </div>

      {/* Market state */}
      <EvidencePanel title="Market State" source="Market Intelligence" lastUpdated={twin.freshness}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Top Demand Skills</p>
            {twin.market.topSkills.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm mb-1">
                <span>{s.name}</span>
                <span className="tabular-nums text-xs text-muted-foreground">{s.signal}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Emerging Skills</p>
            {twin.market.emergingSkills.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm mb-1">
                <span>{s.name}</span>
                <StatusPill tone={s.status === "ACCELERATING" ? "critical" : s.status === "EMERGING" ? "attention" : "info"} dot>{s.status.replace(/_/g, " ")}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </EvidencePanel>

      {/* Training + Capability */}
      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="Training State" source="Training Intelligence">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Institutions</span><span className="tabular-nums">{twin.training.institutions}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Training centres</span><span className="tabular-nums">{twin.training.centres}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Course offerings</span><span className="tabular-nums">{twin.training.courseOfferings}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Planned capacity</span><span className="tabular-nums">{twin.training.plannedCapacity} seats</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Enrolled</span><span className="tabular-nums">{twin.training.enrolled}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="tabular-nums">{twin.training.completed}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Certified</span><span className="tabular-nums">{twin.training.certified}</span></div>
          </div>
        </EvidencePanel>

        <EvidencePanel title="Capability State" source="Capability Intelligence">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Course delivery ready</span><StatusPill tone="positive" dot>{twin.capability.readyCourses}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Partially ready</span><StatusPill tone="attention" dot>{twin.capability.partiallyReadyCourses}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Limited readiness</span><StatusPill tone="critical" dot>{twin.capability.limitedReadinessCourses}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total delivery assessments</span><span className="tabular-nums">{twin.capability.totalDeliveryGaps}</span></div>
          </div>
        </EvidencePanel>
      </div>

      {/* Gap + Candidate state */}
      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="Gap Intelligence" source="Gap Intelligence">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">High gaps</span><StatusPill tone="critical" dot>{twin.gaps.highGapCount}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Moderate gaps</span><StatusPill tone="attention" dot>{twin.gaps.moderateGapCount}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Proficiency mismatches</span><StatusPill tone="attention" dot>{twin.gaps.proficiencyMismatchCount}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Covered</span><StatusPill tone="positive" dot>{twin.gaps.coveredCount}</StatusPill></div>
          </div>
        </EvidencePanel>

        <EvidencePanel title="Candidate State" source="Candidate Intelligence">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total candidates</span><span className="tabular-nums">{twin.candidates.totalCandidates}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">High readiness</span><StatusPill tone="positive" dot>{twin.candidates.highReadiness}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Moderate readiness</span><StatusPill tone="info" dot>{twin.candidates.moderateReadiness}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Developing</span><StatusPill tone="attention" dot>{twin.candidates.developing}</StatusPill></div>
          </div>
        </EvidencePanel>
      </div>

      {/* Implementation monitoring */}
      <EvidencePanel title="Implementation Monitoring" source="Outcome Monitoring">
        {outcomesFetch.loading ? <LoadingState /> : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{(outcomesFetch.data?.interventions ?? []).length} district interventions tracked</p>
            {(outcomesFetch.data?.alerts ?? []).slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <StatusPill tone={ALERT_TONE[a.severity] ?? "info"} dot>{a.severity}</StatusPill>
                  <span className="text-xs">{a.alertType.replace(/_/g, " ")}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{a.evidence}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">Pre/post comparison only. Other factors may have contributed. NO causal claim without valid evaluation design.</p>
      </EvidencePanel>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        <button onClick={() => setActiveView("policy-sandbox")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><FlaskConical className="size-4" /><span className="text-sm font-medium">Policy Sandbox</span></div>
          <p className="text-xs text-muted-foreground">Create scenarios, simulate interventions.</p>
        </button>
        <button onClick={() => setActiveView("district-plans")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><Target className="size-4" /><span className="text-sm font-medium">District Plans</span></div>
          <p className="text-xs text-muted-foreground">Evidence-linked planning.</p>
        </button>
        <button onClick={() => setActiveView("outcomes")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><Activity className="size-4" /><span className="text-sm font-medium">Outcomes</span></div>
          <p className="text-xs text-muted-foreground">Plan vs actual, lessons learned.</p>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Policy Sandbox view
// ---------------------------------------------------------------------

export function PolicySandboxView() {
  const { data, loading, error } = useFetch<{ scenarios: { id: string; name: string; description: string | null; status: string; district: { name: string }; _count: { results: number; interventions: number; assumptions: number } }[] }>("/api/v1/scenarios");

  const cols: Column<{ id: string; name: string; description: string | null; status: string; district: { name: string }; _count: { results: number; interventions: number; assumptions: number } }>[] = [
    { key: "name", header: "Scenario", cell: (s) => <div><p className="text-sm font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{s.district.name}</p></div> },
    { key: "status", header: "Status", cell: (s) => <StatusPill tone={s.status === "SIMULATED" ? "positive" : "neutral"} dot>{s.status}</StatusPill>, width: "120px" },
    { key: "interventions", header: "Interventions", cell: (s) => <span className="tabular-nums text-sm">{s._count.interventions}</span>, width: "110px" },
    { key: "assumptions", header: "Assumptions", cell: (s) => <span className="tabular-nums text-sm">{s._count.assumptions}</span>, width: "100px" },
    { key: "results", header: "Results", cell: (s) => <span className="tabular-nums text-sm">{s._count.results}</span>, width: "80px" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Policy Sandbox" description="Create scenarios, configure interventions, simulate impacts, compare alternatives. SIMULATED RESULTS — NOT FORECASTS. Decision support, not automatic decision making." badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>} />
      <div className="rounded-md border border-status-attention/30 bg-status-attention/5 px-4 py-3 text-sm text-foreground/80 flex items-start gap-3">
        <AlertTriangle className="size-4 text-status-attention mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">All scenario results are SIMULATED.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Baseline + explicit intervention + transparent rule = simulated state. NOT a forecast. NOT a guarantee. Weights documented as 'initial system configuration — subject to validation.'</p>
        </div>
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : (
        <DataTable columns={cols} rows={data?.scenarios ?? []} rowKey={(s) => s.id} emptyMessage="No scenarios created yet." />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// District Outcomes view (implementation monitoring + feedback loop)
// ---------------------------------------------------------------------

export function DistrictOutcomesView() {
  const [districtId, setDistrictId] = React.useState<string>("");
  const { data: districtsData } = useFetch<Paginated<District>>("/api/v1/districts?pageSize=100");
  React.useEffect(() => { if (!districtId && districtsData?.items?.length) setDistrictId(districtsData.items[0].id); }, [districtsData, districtId]);

  const { data, loading, error } = useFetch<{ interventions: { id: string; status: string; interventionType: { name: string }; plannedStart: string | null; actualStart: string | null; actualEnd: string | null; kpis: { id: string; metricName: string; baselineValue: string; targetValue: string | null; unit: string | null; observations: { observedValue: string; observationPeriod: string }[] }[]; outcomes: { outcomeType: string; baselineValue: string; observedValue: string; change: string | null; interpretation: string | null }[]; milestones: { name: string; status: string; plannedDate: string; actualDate: string | null }[] }[]; alerts: { id: string; alertType: string; severity: string; evidence: string | null; status: string }[] }>(
    districtId ? `/api/v1/district-outcomes/${districtId}` : null,
    [districtId],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="District Skill Outcomes" description="Implementation tracking, KPI monitoring, pre/post comparison, and outcome feedback. NO causal claims — temporal association only." badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>} />

      <div className="space-y-2 max-w-sm">
        <Label>District</Label>
        <Select value={districtId || "_none"} onValueChange={setDistrictId}>
          <SelectTrigger><SelectValue placeholder="Choose a district…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Choose…</SelectItem>
            {(districtsData?.items ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!districtId || districtId === "_none" ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">Select a district.</div>
      ) : loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : (
        <>
          {/* Alerts */}
          {(data?.alerts ?? []).length > 0 ? (
            <section className="space-y-3">
              <SectionLabel>Monitoring Alerts</SectionLabel>
              <div className="space-y-2">
                {(data?.alerts ?? []).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={ALERT_TONE[a.severity] ?? "info"} dot>{a.severity}</StatusPill>
                      <span className="text-sm">{a.alertType.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{a.evidence}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Interventions */}
          <section className="space-y-3">
            <SectionLabel>Active Interventions</SectionLabel>
            <div className="space-y-3">
              {(data?.interventions ?? []).map((iv) => (
                <div key={iv.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{iv.interventionType.name}</span>
                    <StatusPill tone={READINESS_TONE[iv.status] ?? "neutral"} dot>{iv.status.replace(/_/g, " ")}</StatusPill>
                  </div>

                  {/* Milestones */}
                  {iv.milestones.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Milestones</p>
                      {iv.milestones.map((m) => (
                        <div key={m.name} className="flex items-center gap-2 text-xs">
                          <StatusPill tone={m.status === "COMPLETED" ? "positive" : m.status === "DELAYED" ? "attention" : "neutral"} dot>{m.status}</StatusPill>
                          <span>{m.name}</span>
                          <span className="text-muted-foreground ml-auto">{new Date(m.plannedDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* KPIs */}
                  {iv.kpis.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">KPIs</p>
                      {iv.kpis.map((k) => {
                        const latest = k.observations[0];
                        return (
                          <div key={k.id} className="grid grid-cols-4 gap-2 text-xs">
                            <div><span className="text-muted-foreground">Metric:</span> {k.metricName}</div>
                            <div><span className="text-muted-foreground">Baseline:</span> {k.baselineValue} {k.unit ?? ""}</div>
                            <div><span className="text-muted-foreground">Target:</span> {k.targetValue ?? "—"} {k.unit ?? ""}</div>
                            <div><span className="text-muted-foreground">Actual:</span> {latest?.observedValue ?? "INSUFFICIENT_DATA"} {k.unit ?? ""}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Outcomes */}
                  {iv.outcomes.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Outcomes (Pre/Post)</p>
                      {iv.outcomes.map((o, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-muted-foreground">{o.outcomeType.replace(/_/g, " ")}:</span>
                          <span className="ml-2">{o.baselineValue} → {o.observedValue}</span>
                          {o.change ? <span className="ml-2 text-status-positive">{o.change}</span> : null}
                          {o.interpretation ? <p className="text-[11px] text-muted-foreground mt-0.5">{o.interpretation}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <p className="text-[11px] text-muted-foreground">Pre/post comparison only. Other factors may have contributed. NO causal claim without valid evaluation design. This is continuous intelligence, not intervention evaluation.</p>
        </>
      )}
    </div>
  );
}
