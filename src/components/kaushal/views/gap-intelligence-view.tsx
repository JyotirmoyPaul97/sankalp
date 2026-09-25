"use client";

import * as React from "react";
import { ArrowRight, GitCompareArrows, MapPin, Building2, AlertTriangle, CheckCircle2, TrendingUp, GraduationCap } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/store/app-store";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { GapSignal, DistrictGapSummary, ClusterGapSummary, GapMatrixRow, Paginated, District, Sector } from "@/types/domain";

const SIGNAL_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  HIGH_GAP: "critical", MODERATE_GAP: "attention", LOW_GAP: "positive",
  SUPPLY_PRESENT: "positive", SUPPLY_LIMITED: "attention", NO_IDENTIFIED_SUPPLY: "critical",
  PROFICIENCY_MISMATCH: "attention", GEOGRAPHIC_GAP: "attention", INSUFFICIENT_DATA: "neutral",
};
const DEMAND_TONE: Record<string, "positive" | "info" | "attention" | "neutral"> = {
  HIGH: "attention", MEDIUM: "info", LOW: "neutral", NONE: "neutral",
};

export function GapIntelligenceView() {
  const setActiveView = useNav((s) => s.setActiveView);
  const [districtId, setDistrictId] = React.useState<string>("");
  const [sectorId, setSectorId] = React.useState<string>("");

  const { data: districtsData } = useFetch<Paginated<District>>("/api/v1/districts?pageSize=100");
  const { data: sectorsData } = useFetch<Paginated<Sector>>("/api/v1/sectors?pageSize=100");

  const filterQ = `${districtId ? `&districtId=${districtId}` : ""}${sectorId ? `&sectorId=${sectorId}` : ""}`;
  const skillsFetch = useFetch<{ skills: GapSignal[] }>(`/api/v1/gaps/skills?${filterQ.slice(1)}`);
  const rolesFetch = useFilterableGaps(`/api/v1/gaps/roles?${filterQ.slice(1)}`);
  const districtsFetch = useFetch<{ districts: DistrictGapSummary[] }>("/api/v1/gaps/districts");

  const topSkillGaps = (skillsFetch.data?.skills ?? []).filter((g) => g.gapScore > 0).slice(0, 10);
  const topRoleGaps = (rolesFetch.data?.roles ?? []).filter((g) => g.gapScore > 0).slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Supply & Gap Intelligence"
        description="Compare observed labour-market demand with the training ecosystem that currently serves it. OBSERVATION + LIMITED INTERPRETATION — not recommendations."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      {/* Two-sided model banner */}
      <div className="rounded-lg border bg-card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="size-6 text-primary" />
          <div><p className="text-sm font-medium">MARKET DEMAND</p><p className="text-xs text-muted-foreground">Market demand signals</p></div>
        </div>
        <ArrowRight className="size-5 text-muted-foreground rotate-90 md:rotate-0" />
        <div className="flex items-center gap-3">
          <GraduationCap className="size-6 text-primary" />
          <div><p className="text-sm font-medium">TRAINING SUPPLY</p><p className="text-xs text-muted-foreground">Training capacity data</p></div>
        </div>
        <ArrowRight className="size-5 text-muted-foreground rotate-90 md:rotate-0" />
        <div className="flex items-center gap-3">
          <GitCompareArrows className="size-6 text-primary" />
          <div><p className="text-sm font-medium">GAP INTELLIGENCE</p><p className="text-xs text-muted-foreground">Where mismatches appear</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>District</Label>
          <Select value={districtId || "ALL"} onValueChange={(v) => setDistrictId(v === "ALL" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="All districts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All districts</SelectItem>
              {(districtsData?.items ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Sector</Label>
          <Select value={sectorId || "ALL"} onValueChange={(v) => setSectorId(v === "ALL" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="All sectors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sectors</SelectItem>
              {(sectorsData?.items ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top Gap Signals */}
      <section className="space-y-3">
        <SectionLabel>Observed Training Gap Signals — Skills</SectionLabel>
        {skillsFetch.loading ? <LoadingState /> : skillsFetch.error ? <ErrorState message={skillsFetch.error.message} /> : (
          <GapTable gaps={topSkillGaps} onSelect={(id) => setActiveView(`gap-skill:${id}`)} />
        )}
      </section>

      <section className="space-y-3">
        <SectionLabel>Observed Training Gap Signals — Roles</SectionLabel>
        {rolesFetch.loading ? <LoadingState /> : rolesFetch.error ? <ErrorState message={rolesFetch.error.message} /> : (
          <GapTable gaps={topRoleGaps} onSelect={(id) => setActiveView(`gap-role:${id}`)} />
        )}
      </section>

      {/* District gap summary */}
      <section className="space-y-3">
        <SectionLabel>District Gap Summary</SectionLabel>
        {districtsFetch.loading ? <LoadingState /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(districtsFetch.data?.districts ?? []).slice(0, 6).map((d) => (
              <button key={d.district.id} onClick={() => setDistrictId(d.district.id)} className="text-left rounded-lg border bg-card p-4 space-y-2 hover:border-primary/40 hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{d.district.name}</span>
                  <MapPin className="size-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><span className="text-muted-foreground">High gaps:</span> <span className="text-status-critical font-medium">{d.highGapCount}</span></div>
                  <div><span className="text-muted-foreground">Prof. mismatch:</span> <span className="text-status-attention font-medium">{d.proficiencyMismatchCount}</span></div>
                  <div><span className="text-muted-foreground">No supply:</span> <span className="text-status-critical font-medium">{d.noSupplyCount}</span></div>
                  <div><span className="text-muted-foreground">Covered:</span> <span className="text-status-positive font-medium">{d.coveredCount}</span></div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="grid sm:grid-cols-3 gap-3">
        <button onClick={() => setActiveView("gap-matrix")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><GitCompareArrows className="size-4" /><span className="text-sm font-medium">Market–Training Matrix</span></div>
          <p className="text-xs text-muted-foreground">Side-by-side comparison of demand vs supply per role.</p>
        </button>
        <button onClick={() => setActiveView("gap-districts")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><MapPin className="size-4" /><span className="text-sm font-medium">District Gap View</span></div>
          <p className="text-xs text-muted-foreground">Geographic gap distribution across districts.</p>
        </button>
        <button onClick={() => setActiveView("gap-clusters")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><Building2 className="size-4" /><span className="text-sm font-medium">Cluster Gap View</span></div>
          <p className="text-xs text-muted-foreground">Local economic cluster gap intelligence.</p>
        </button>
      </section>
    </div>
  );
}

function useFilterableGaps(path: string) {
  const [data, setData] = React.useState<{ roles: GapSignal[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ message: string } | null>(null);
  React.useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    fetch(path)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) { setData(d.data); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError({ message: e.message }); setLoading(false); } });
    return () => { cancelled = true; };
  }, [path]);
  return { data, loading, error };
}

function GapTable({ gaps, onSelect }: { gaps: GapSignal[]; onSelect: (id: string) => void }) {
  const cols: Column<GapSignal>[] = [
    { key: "entity", header: "Skill / Role", cell: (g) => (
      <div><p className="text-sm font-medium">{g.skill?.name ?? g.jobRole?.title ?? "—"}</p>{g.district ? <p className="text-[11px] text-muted-foreground">{g.district.name}</p> : null}</div>
    )},
    { key: "demand", header: "Demand", cell: (g) => <StatusPill tone={DEMAND_TONE[g.marketDemandSignal] ?? "neutral"} dot>{g.marketDemandSignal}</StatusPill>, width: "90px" },
    { key: "supply", header: "Supply", cell: (g) => <StatusPill tone={DEMAND_TONE[g.trainingSupplySignal] ?? "neutral"} dot>{g.trainingSupplySignal}</StatusPill>, width: "90px" },
    { key: "gap", header: "Gap Signal", cell: (g) => <StatusPill tone={SIGNAL_TONE[g.gapSignal] ?? "neutral"} dot>{g.gapSignal.replace(/_/g, " ")}</StatusPill>, width: "170px" },
    { key: "score", header: "Gap Score", cell: (g) => (
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full ${g.gapScore >= 50 ? "bg-status-critical" : g.gapScore >= 25 ? "bg-status-attention" : "bg-status-positive"}`} style={{ width: `${g.gapScore}%` }} /></div>
        <span className="text-xs tabular-nums">{Math.round(g.gapScore)}</span>
      </div>
    ), width: "100px" },
    { key: "prof", header: "Proficiency", cell: (g) => g.proficiencyStatus !== "UNKNOWN" && g.proficiencyStatus !== "INSUFFICIENT_DATA" ? <StatusPill tone={g.proficiencyStatus === "ALIGNED" ? "positive" : "attention"} dot>{g.proficiencyStatus.replace(/_/g, " ")}</StatusPill> : <span className="text-xs text-muted-foreground">—</span>, width: "140px" },
    { key: "conf", header: "Confidence", cell: (g) => <StatusPill tone={g.confidenceLevel === "HIGH" ? "positive" : g.confidenceLevel === "MEDIUM" ? "info" : "attention"} dot>{g.confidenceLevel}</StatusPill>, width: "100px" },
  ];
  return <DataTable columns={cols} rows={gaps} rowKey={(g) => g.id} onRowClick={(g) => onSelect(g.id)} emptyMessage="No gap signals." />;
}

// ---------------------------------------------------------------------
// Gap Detail view (skill or role)
// ---------------------------------------------------------------------

export function GapDetailView() {
  const activeView = useNav((s) => s.activeView);
  const setActiveView = useNav((s) => s.setActiveView);
  const [showExplanation, setShowExplanation] = React.useState(false);

  const isSkill = activeView.startsWith("gap-skill:");
  const gapId = activeView.split(":")[1];

  const { data, loading, error } = useFetch<{ gap: GapSignal; reasons: string[]; methodology: string }>(
    gapId ? `/api/v1/gaps/${gapId}/explanation` : null,
    [gapId],
  );

  if (loading && !data) return <LoadingState label="Loading gap detail…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <ErrorState title="Gap not found" />;

  const gap = data.gap;
  const entityName = gap.skill?.name ?? gap.jobRole?.title ?? "—";

  return (
    <div className="space-y-6">
      <button onClick={() => setActiveView("gap-intelligence")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="size-4 rotate-180" /> Back to Gap Intelligence
      </button>
      <PageHeader
        title={`${entityName} — Gap Analysis`}
        description={`Observed demand–supply gap for ${entityName}. Evidence-backed, not a recommendation.`}
        badge={<StatusPill tone={SIGNAL_TONE[gap.gapSignal] ?? "neutral"} dot>{gap.gapSignal.replace(/_/g, " ")}</StatusPill>}
      />

      {/* Market vs Supply metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Market Demand" value={<StatusPill tone={DEMAND_TONE[gap.marketDemandSignal] ?? "neutral"} dot>{gap.marketDemandSignal}</StatusPill>} hint={`Strength: ${Math.round(gap.marketDemandStrength)}/100`} tone="info" />
        <MetricCard label="Training Supply" value={<StatusPill tone={DEMAND_TONE[gap.trainingSupplySignal] ?? "neutral"} dot>{gap.trainingSupplySignal}</StatusPill>} hint={`Strength: ${Math.round(gap.trainingSupplyStrength)}/100`} tone="default" />
        <MetricCard label="Gap Score" value={Math.round(gap.gapScore)} hint="/100 (Training Gap Signal)" tone={gap.gapScore >= 50 ? "critical" : gap.gapScore >= 25 ? "attention" : "positive"} />
        <MetricCard label="Confidence" value={<StatusPill tone={gap.confidenceLevel === "HIGH" ? "positive" : gap.confidenceLevel === "MEDIUM" ? "info" : "attention"} dot>{gap.confidenceLevel}</StatusPill>} />
      </div>

      {/* Two-sided evidence */}
      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="Demand Evidence (Market)" source="Market Intelligence">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Demand signal</span><StatusPill tone={DEMAND_TONE[gap.marketDemandSignal] ?? "neutral"} dot>{gap.marketDemandSignal}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Demand strength</span><span className="tabular-nums">{Math.round(gap.marketDemandStrength)}/100</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Unique employers</span><span className="tabular-nums">{gap.uniqueEmployers}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Evidence count</span><span className="tabular-nums">{gap.marketEvidenceCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Trend</span><StatusPill tone={gap.trendDirection === "INCREASING" ? "positive" : gap.trendDirection === "DECREASING" ? "critical" : "neutral"} dot>{gap.trendDirection}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Required proficiency</span><span className="font-medium">{gap.requiredProficiency ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Source diversity</span><span className="tabular-nums">{gap.sourceDiversity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Data status</span><StatusPill tone="attention" dot>{gap.dataStatus}</StatusPill></div>
          </div>
        </EvidencePanel>

        <EvidencePanel title="Supply Evidence (Training)" source="Training Intelligence">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Supply signal</span><StatusPill tone={DEMAND_TONE[gap.trainingSupplySignal] ?? "neutral"} dot>{gap.trainingSupplySignal}</StatusPill></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Supply strength</span><span className="tabular-nums">{Math.round(gap.trainingSupplyStrength)}/100</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Course count</span><span className="tabular-nums">{gap.courseCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Institutions</span><span className="tabular-nums">{gap.institutionCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Centres</span><span className="tabular-nums">{gap.centreCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Planned capacity</span><span className="tabular-nums">{gap.plannedCapacity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Enrolled</span><span className="tabular-nums">{gap.enrolledCount ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="tabular-nums">{gap.completedCount ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Certified</span><span className="tabular-nums">{gap.certifiedCount ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Training proficiency</span><span className="font-medium">{gap.trainingProficiency ?? "—"}</span></div>
          </div>
        </EvidencePanel>
      </div>

      {/* Gap dimensions */}
      <EvidencePanel title="Gap Dimensions" source="Gap Intelligence Engine">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { k: "Coverage", v: gap.coverageStatus },
            { k: "Proficiency", v: gap.proficiencyStatus },
            { k: "Capacity", v: gap.capacityStatus },
            { k: "Geographic", v: gap.geographicStatus },
          ].map((d) => (
            <div key={d.k} className="rounded-md border p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.k}</p>
              <StatusPill tone={d.v.includes("WELL") || d.v === "ALIGNED" || d.v === "ADEQUATE" || d.v === "LOCAL" ? "positive" : d.v.includes("NO") || d.v.includes("INSUFFICIENT") ? "neutral" : "attention"} dot>{d.v.replace(/_/g, " ")}</StatusPill>
            </div>
          ))}
        </div>
      </EvidencePanel>

      {/* Explanation */}
      <EvidencePanel title="Why is this classified as a gap?" source="Rule-based explanation">
        <button onClick={() => setShowExplanation(!showExplanation)} className="text-sm text-primary hover:underline">
          {showExplanation ? "Hide" : "Show"} explanation
        </button>
        {showExplanation ? (
          <ol className="mt-3 space-y-1.5 list-decimal pl-5 text-sm">
            {data.reasons.map((r, i) => <li key={i} className="text-foreground/80">{r}</li>)}
          </ol>
        ) : null}
        <p className="mt-3 text-[11px] text-muted-foreground">{data.methodology}</p>
      </EvidencePanel>
    </div>
  );
}

// ---------------------------------------------------------------------
// District Gap View
// ---------------------------------------------------------------------

export function DistrictGapView() {
  const { data, loading, error } = useFetch<{ districts: DistrictGapSummary[] }>("/api/v1/gaps/districts");
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-6">
      <PageHeader title="District Gap View" description="Geographic distribution of demand–supply gap signals across districts." badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data?.districts ?? []).map((d) => (
          <div key={d.district.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{d.district.name}</span>
              <MapPin className="size-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2"><p className="text-muted-foreground">High gaps</p><p className="text-status-critical font-semibold tabular-nums">{d.highGapCount}</p></div>
              <div className="rounded border p-2"><p className="text-muted-foreground">Prof. mismatch</p><p className="text-status-attention font-semibold tabular-nums">{d.proficiencyMismatchCount}</p></div>
              <div className="rounded border p-2"><p className="text-muted-foreground">No supply</p><p className="text-status-critical font-semibold tabular-nums">{d.noSupplyCount}</p></div>
              <div className="rounded border p-2"><p className="text-muted-foreground">Covered</p><p className="text-status-positive font-semibold tabular-nums">{d.coveredCount}</p></div>
            </div>
            {d.topGaps.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top gaps</p>
                {d.topGaps.slice(0, 3).map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{g.skill}</span>
                    <StatusPill tone={SIGNAL_TONE[g.gapSignal] ?? "neutral"} dot>{g.gapSignal.replace(/_/g, " ")}</StatusPill>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Cluster Gap View
// ---------------------------------------------------------------------

export function ClusterGapView() {
  const { data, loading, error } = useFetch<{ clusters: ClusterGapSummary[] }>("/api/v1/gaps/clusters");
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Cluster Gap View" description="Local economic cluster demand–supply gap intelligence — a major differentiator of KAUSHAL DRISHTI." badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>} />
      <div className="grid sm:grid-cols-2 gap-3">
        {(data?.clusters ?? []).map((c) => (
          <div key={c.cluster.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{c.cluster.name}</p>
              <p className="text-[11px] text-muted-foreground">{c.cluster.district} · {c.cluster.sector}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill tone={c.highGapCount > 3 ? "critical" : c.highGapCount > 0 ? "attention" : "positive"} dot>{c.highGapCount} high gaps</StatusPill>
              <span className="text-xs text-muted-foreground">of {c.totalGaps} total</span>
            </div>
            {c.topGapSkills.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top gap skills</p>
                {c.topGapSkills.slice(0, 3).map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{g.skill}</span>
                    <StatusPill tone={SIGNAL_TONE[g.gapSignal] ?? "neutral"} dot>{g.gapSignal.replace(/_/g, " ")}</StatusPill>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Market–Training Matrix
// ---------------------------------------------------------------------

export function GapMatrixView() {
  const { data, loading, error } = useFetch<{ matrix: GapMatrixRow[] }>("/api/v1/gaps/matrix");
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;

  const cols: Column<GapMatrixRow>[] = [
    { key: "role", header: "Role", cell: (r) => <span className="text-sm font-medium">{r.role}</span> },
    { key: "demand", header: "Demand", cell: (r) => <StatusPill tone={DEMAND_TONE[r.demand] ?? "neutral"} dot>{r.demand}</StatusPill>, width: "90px" },
    { key: "supply", header: "Supply", cell: (r) => <StatusPill tone={DEMAND_TONE[r.supply] ?? "neutral"} dot>{r.supply}</StatusPill>, width: "90px" },
    { key: "coverage", header: "Coverage", cell: (r) => <span className="text-xs">{r.coverage.replace(/_/g, " ")}</span>, width: "140px" },
    { key: "proficiency", header: "Proficiency", cell: (r) => <span className="text-xs">{r.proficiency.replace(/_/g, " ")}</span>, width: "140px" },
    { key: "gap", header: "Gap Signal", cell: (r) => <StatusPill tone={SIGNAL_TONE[r.gapSignal] ?? "neutral"} dot>{r.gapSignal.replace(/_/g, " ")}</StatusPill>, width: "150px" },
    { key: "score", header: "Gap Score", cell: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full ${r.gapScore >= 50 ? "bg-status-critical" : r.gapScore >= 25 ? "bg-status-attention" : "bg-status-positive"}`} style={{ width: `${r.gapScore}%` }} /></div>
        <span className="text-xs tabular-nums">{Math.round(r.gapScore)}</span>
      </div>
    ), width: "100px" },
    { key: "conf", header: "Confidence", cell: (r) => <StatusPill tone={r.confidence === "HIGH" ? "positive" : r.confidence === "MEDIUM" ? "info" : "attention"} dot>{r.confidence}</StatusPill>, width: "100px" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Market–Training Matrix" description="Side-by-side comparison of observed demand vs training supply for each role. Filterable by district and sector." badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>} />
      <DataTable columns={cols} rows={data?.matrix ?? []} rowKey={(r) => `${r.role}-${r.gapSignal}`} emptyMessage="No matrix data." />
      <p className="text-[11px] text-muted-foreground">Gap signal computed from transparent rules comparing normalized demand (0-100) with normalized supply (0-100). Weights documented as 'initial system configuration — subject to validation.' No workforce-unit estimation.</p>
    </div>
  );
}
