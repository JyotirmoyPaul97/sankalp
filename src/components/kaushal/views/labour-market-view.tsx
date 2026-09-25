"use client";

import * as React from "react";
import { TrendingUp, MapPin, Building2, Sparkles, Gauge, ArrowRight, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
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
import type { MarketDemandRole, MarketDemandSkill, Paginated, District, Sector, Skill } from "@/types/domain";

const SIGNAL_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  HIGH: "positive", MEDIUM: "info", LOW: "attention", NONE: "neutral",
};
const TREND_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  INCREASING: "positive", STABLE: "info", DECREASING: "critical", UNKNOWN: "neutral",
};
const CONFIDENCE_TONE: Record<string, "positive" | "info" | "attention" | "critical"> = {
  HIGH: "positive", MEDIUM: "info", LOW: "attention", INSUFFICIENT: "critical",
};

export function LabourMarketView() {
  const setActiveView = useNav((s) => s.setActiveView);
  const [districtId, setDistrictId] = React.useState<string>("");
  const [sectorId, setSectorId] = React.useState<string>("");

  const { data: districtsData } = useFetch<Paginated<District>>("/api/v1/districts?pageSize=100");
  const { data: sectorsData } = useFetch<Paginated<Sector>>("/api/v1/sectors?pageSize=100");

  // Build filter query
  const filterQ = `${districtId ? `&district=${districtId}` : ""}${sectorId ? `&sector=${sectorId}` : ""}`;
  const rolesFetch = useFetch<{ roles: MarketDemandRole[] }>(`/api/v1/market-demand/roles?${filterQ.slice(1)}`);
  const skillsFetch = useFetch<{ skills: MarketDemandSkill[] }>(`/api/v1/market-demand/skills?${filterQ.slice(1)}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Labour Market Intelligence"
        description="Understand what Maharashtra's economy is demanding, where demand is concentrated, and how requirements are changing. OBSERVED MARKET SIGNALS — not government recommendations."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

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

      {/* Top Demand Roles */}
      <section className="space-y-3">
        <SectionLabel>Top Demand Roles</SectionLabel>
        {rolesFetch.loading ? <LoadingState label="Loading roles…" /> : rolesFetch.error ? <ErrorState message={rolesFetch.error.message} /> : (
          <RoleDemandTable roles={rolesFetch.data?.roles ?? []} onSelectRole={(id) => setActiveView(`role-demand:${id}`)} />
        )}
      </section>

      {/* Top Demand Skills */}
      <section className="space-y-3">
        <SectionLabel>Top Demand Skills</SectionLabel>
        {skillsFetch.loading ? <LoadingState label="Loading skills…" /> : skillsFetch.error ? <ErrorState message={skillsFetch.error.message} /> : (
          <SkillDemandTable skills={skillsFetch.data?.skills ?? []} onSelectSkill={(id) => setActiveView(`skill-demand:${id}`)} />
        )}
      </section>

      {/* Quick links */}
      <section className="grid sm:grid-cols-3 gap-3">
        <button onClick={() => setActiveView("emerging-radar")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><Sparkles className="size-4" /><span className="text-sm font-medium">Emerging Skill Radar</span></div>
          <p className="text-xs text-muted-foreground">Observed emerging signals (not forecasts).</p>
        </button>
        <button onClick={() => setActiveView("market-trends")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><TrendingUp className="size-4" /><span className="text-sm font-medium">Market Trends</span></div>
          <p className="text-xs text-muted-foreground">Time-series across 12 monthly periods.</p>
        </button>
        <button onClick={() => setActiveView("evidence-convergence")} className="text-left rounded-lg border bg-card p-4 space-y-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 text-primary"><Gauge className="size-4" /><span className="text-sm font-medium">Evidence Convergence</span></div>
          <p className="text-xs text-muted-foreground">Cross-source agreement + conflicts.</p>
        </button>
      </section>
    </div>
  );
}

function RoleDemandTable({ roles, onSelectRole }: { roles: MarketDemandRole[]; onSelectRole: (id: string) => void }) {
  const cols: Column<MarketDemandRole>[] = [
    { key: "role", header: "Role", cell: (r) => (
      <div><p className="text-sm font-medium">{r.role.title}</p><p className="text-[11px] text-muted-foreground">{r.role.sector ?? "—"}</p></div>
    )},
    { key: "signal", header: "Demand Signal", cell: (r) => <StatusPill tone={SIGNAL_TONE[r.demandSignal] ?? "neutral"} dot>{r.demandSignal}</StatusPill>, width: "130px" },
    { key: "strength", header: "Strength", cell: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${r.signalStrength}%` }} /></div>
        <span className="text-xs tabular-nums">{r.signalStrength}</span>
      </div>
    ), width: "120px" },
    { key: "trend", header: "Trend", cell: (r) => <StatusPill tone={TREND_TONE[r.trend] ?? "neutral"} dot>{r.trend}</StatusPill>, width: "120px" },
    { key: "employers", header: "Employers", cell: (r) => <span className="tabular-nums text-sm">{r.uniqueEmployers}</span>, width: "90px" },
    { key: "evidence", header: "Evidence", cell: (r) => <span className="tabular-nums text-sm">{r.evidenceCount}</span>, width: "90px" },
    { key: "confidence", header: "Confidence", cell: (r) => <StatusPill tone={CONFIDENCE_TONE[r.confidence] ?? "neutral"} dot>{r.confidence}</StatusPill>, width: "120px" },
  ];
  return <DataTable columns={cols} rows={roles.slice(0, 10)} rowKey={(r) => r.role.id} onRowClick={(r) => onSelectRole(r.role.id)} emptyMessage="No role demand signals." />;
}

function SkillDemandTable({ skills, onSelectSkill }: { skills: MarketDemandSkill[]; onSelectSkill: (id: string) => void }) {
  const cols: Column<MarketDemandSkill>[] = [
    { key: "skill", header: "Skill", cell: (s) => (
      <div><p className="text-sm font-medium">{s.skill.name}</p><p className="text-[11px] text-muted-foreground font-mono">{s.skill.canonicalName}</p></div>
    )},
    { key: "signal", header: "Demand Signal", cell: (s) => <StatusPill tone={SIGNAL_TONE[s.demandSignal] ?? "neutral"} dot>{s.demandSignal}</StatusPill>, width: "130px" },
    { key: "strength", header: "Strength", cell: (s) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${s.signalStrength}%` }} /></div>
        <span className="text-xs tabular-nums">{s.signalStrength}</span>
      </div>
    ), width: "120px" },
    { key: "trend", header: "Trend", cell: (s) => <StatusPill tone={TREND_TONE[s.trend] ?? "neutral"} dot>{s.trend}</StatusPill>, width: "120px" },
    { key: "employers", header: "Employers", cell: (s) => <span className="tabular-nums text-sm">{s.uniqueEmployers}</span>, width: "90px" },
    { key: "districts", header: "Districts", cell: (s) => <span className="tabular-nums text-sm">{s.districtCount}</span>, width: "90px" },
    { key: "sectors", header: "Sectors", cell: (s) => <span className="tabular-nums text-sm">{s.sectorCount}</span>, width: "80px" },
    { key: "confidence", header: "Confidence", cell: (s) => <StatusPill tone={CONFIDENCE_TONE[s.confidence] ?? "neutral"} dot>{s.confidence}</StatusPill>, width: "120px" },
  ];
  return <DataTable columns={cols} rows={skills.slice(0, 10)} rowKey={(s) => s.skill.id} onRowClick={(s) => onSelectSkill(s.skill.id)} emptyMessage="No skill demand signals." />;
}

// ---------------------------------------------------------------------
// Role Demand Detail view
// ---------------------------------------------------------------------

export function RoleDemandDetailView() {
  const activeView = useNav((s) => s.activeView);
  const setActiveView = useNav((s) => s.setActiveView);
  const roleId = activeView.startsWith("role-demand:") ? activeView.split(":")[1] : null;

  // Load the role + its market intelligence
  const roleFetch = useFetch<{ profile: { roleId: string; roleTitle: string; competencies: { skillId: string; skillName: string; proficiencyExpected: string; importance: number }[] } }>(
    roleId ? `/api/v1/job-roles/${roleId}/competency` : null,
    [roleId],
  );
  const intelFetch = useFetch<{ roles: MarketDemandRole[] }>(`/api/v1/market-demand/roles`);
  const intel = intelFetch.data?.roles.find((r) => r.role.id === roleId);

  if (!roleId) return <ErrorState title="No role selected" />;
  const role = roleFetch.data?.profile;

  return (
    <div className="space-y-6">
      <button onClick={() => setActiveView("labour-market")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="size-4 rotate-180" /> Back to Labour Market
      </button>
      <PageHeader
        title={role?.roleTitle ?? "Role Demand"}
        description="Observed market demand for this role — evidence-backed, not a recommendation."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      {intel ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Demand Signal" value={<StatusPill tone={SIGNAL_TONE[intel.demandSignal] ?? "neutral"} dot>{intel.demandSignal}</StatusPill>} />
          <MetricCard label="Signal Strength" value={intel.signalStrength} hint="/100" />
          <MetricCard label="Trend" value={<StatusPill tone={TREND_TONE[intel.trend] ?? "neutral"} dot>{intel.trend}</StatusPill>} />
          <MetricCard label="Unique Employers" value={intel.uniqueEmployers} />
          <MetricCard label="Confidence" value={<StatusPill tone={CONFIDENCE_TONE[intel.confidence] ?? "neutral"} dot>{intel.confidence}</StatusPill>} />
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="Required Competencies" source="Competency Profile" confidence="high">
          {roleFetch.loading ? <LoadingState /> : role ? (
            <ul className="space-y-1.5">
              {role.competencies.map((c) => (
                <li key={c.skillId} className="flex items-center justify-between text-sm">
                  <span>{c.skillName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">imp={c.importance}</span>
                    <StatusPill tone={c.proficiencyExpected === "EXPERT" ? "attention" : c.proficiencyExpected === "PROFICIENT" ? "positive" : "info"} dot>{c.proficiencyExpected}</StatusPill>
                  </div>
                </li>
              ))}
            </ul>
          ) : <ErrorState message="No competency profile" />}
        </EvidencePanel>

        <EvidencePanel title="Evidence Summary" source="Market Intelligence">
          {intel ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border p-2"><p className="text-muted-foreground">Evidence count</p><p className="tabular-nums font-medium">{intel.evidenceCount}</p></div>
                <div className="rounded border p-2"><p className="text-muted-foreground">Source diversity</p><p className="tabular-nums font-medium">{intel.sourceDiversity}</p></div>
                <div className="rounded border p-2"><p className="text-muted-foreground">Unique employers</p><p className="tabular-nums font-medium">{intel.uniqueEmployers}</p></div>
                <div className="rounded border p-2"><p className="text-muted-foreground">Unique postings</p><p className="tabular-nums font-medium">{intel.uniquePostings}</p></div>
              </div>
              <p className="text-[11px] text-muted-foreground pt-2">Geographic coverage: {intel.geographicCoverage}. Demand signal computed from weighted evidence sources (weights documented as 'initial system configuration, subject to validation').</p>
            </div>
          ) : <LoadingState />}
        </EvidencePanel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Skill Demand Detail view
// ---------------------------------------------------------------------

export function SkillDemandDetailView() {
  const activeView = useNav((s) => s.activeView);
  const setActiveView = useNav((s) => s.setActiveView);
  const skillId = activeView.startsWith("skill-demand:") ? activeView.split(":")[1] : null;
  const intelFetch = useFetch<{ signalStrength: number; signalLabel: string; trendDirection: string; confidenceLevel: string; evidenceCount: number; sourceDiversity: number; uniqueEmployers: number; convergence: string; sourceBreakdown: { sourceType: string; signalValue: number; direction: string; employers: number }[]; dataStatus: string; dataFreshness: string; methodology: string }>(
    skillId ? `/api/v1/market-demand/convergence?skillId=${skillId}` : null,
    [skillId],
  );
  const trendFetch = useFetch<{ series: { period: string; signalValue: number; direction: string }[] }>(
    skillId ? `/api/v1/market-demand/trends?skillId=${skillId}` : null,
    [skillId],
  );

  if (!skillId) return <ErrorState title="No skill selected" />;
  const intel = intelFetch.data;

  return (
    <div className="space-y-6">
      <button onClick={() => setActiveView("labour-market")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="size-4 rotate-180" /> Back to Labour Market
      </button>
      <PageHeader
        title="Skill Demand"
        description="Observed market demand signal for this skill — evidence-backed, not a recommendation."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      {intel ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Demand Signal" value={<StatusPill tone={SIGNAL_TONE[intel.overall === "CONVERGING" ? "HIGH" : "MEDIUM"] ?? "neutral"} dot>{intel.jobPosting.signal > 30 ? "HIGH" : intel.jobPosting.signal > 10 ? "MEDIUM" : "LOW"}</StatusPill>} />
          <MetricCard label="Evidence Count" value={intel.evidenceCount} />
          <MetricCard label="Source Diversity" value={intel.sourceDiversity} hint="source types" />
          <MetricCard label="Unique Employers" value={intel.uniqueEmployers} />
          <MetricCard label="Confidence" value={<StatusPill tone={intel.confidence >= 0.7 ? "positive" : intel.confidence >= 0.4 ? "info" : "attention"} dot>{Math.round(intel.confidence * 100)}%</StatusPill>} />
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="Historical Trend" source="12 monthly periods" lastUpdated={intel?.dataFreshness}>
          {trendFetch.loading ? <LoadingState /> : trendFetch.data ? (
            <div className="space-y-1">
              {trendFetch.data.series.length === 0 ? <p className="text-sm text-muted-foreground">No trend data — INSUFFICIENT_DATA.</p> : (
                <div className="space-y-1 max-h-64 overflow-y-auto scroll-thin">
                  {trendFetch.data.series.map((p) => {
                    const max = Math.max(...trendFetch.data!.series.map((x) => x.signalValue), 1);
                    return (
                      <div key={p.period} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground w-16">{p.period}</span>
                        <div className="flex-1 h-3 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(p.signalValue / max) * 100}%` }} /></div>
                        <span className="tabular-nums w-8 text-right">{p.signalValue}</span>
                        <StatusPill tone={TREND_TONE[p.direction] ?? "neutral"} dot>{p.direction.slice(0, 3)}</StatusPill>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : <ErrorState message="Trend unavailable" />}
        </EvidencePanel>

        <EvidencePanel title="Evidence Convergence" source={intel ? `overall: ${intel.overall}` : "—"}>
          {intel ? (
            <div className="space-y-2">
              {[
                { k: "Job Postings", v: intel.jobPosting },
                { k: "Employer Surveys", v: intel.employerSurvey },
                { k: "Industry Consultations", v: intel.industryConsultation },
                { k: "Sector Growth", v: intel.sectorGrowth },
                { k: "Technology Trends", v: intel.technologyTrend },
                { k: "Placement Outcomes", v: intel.placementOutcome },
              ].map((s) => (
                <div key={s.k} className="flex items-center justify-between text-sm">
                  <span>{s.k}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">{s.v.signal}</span>
                    <StatusPill tone={TREND_TONE[s.v.direction] ?? "neutral"} dot>{s.v.direction}</StatusPill>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Overall:</span>
                <StatusPill tone={intel.overall === "CONVERGING" ? "positive" : intel.overall === "MIXED" ? "attention" : "neutral"} dot>{intel.overall.replace(/_/g, " ")}</StatusPill>
              </div>
            </div>
          ) : <LoadingState />}
        </EvidencePanel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Emerging Skill Radar view
// ---------------------------------------------------------------------

export function EmergingRadarView() {
  const { data, loading, error } = useFetch<{ entries: { skillId: string; skillName: string; emergenceStatus: string; signalStrength: number; recentActivity: number; trendVelocity: number; persistence: number; sourceDiversity: number; technologyLink: string | null; firstObserved: string | null; confidence: number; evidenceCount: number }[]; disclaimer: string }>("/api/v1/market-demand/emerging-skills");

  const STATUS_TONE: Record<string, "positive" | "info" | "attention" | "neutral"> = {
    ACCELERATING: "positive", EMERGING: "info", EARLY_SIGNAL: "attention", INSUFFICIENT_EVIDENCE: "neutral",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emerging Skill Radar"
        description="Observed emerging-technology + emerging-skill signals from multiple evidence streams. This is a SIGNAL, not a guaranteed future demand forecast."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="rounded-md border border-status-attention/30 bg-status-attention/5 px-4 py-3 text-sm text-foreground/80 flex items-start gap-3">
        <AlertTriangle className="size-4 text-status-attention mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Synthetic Demonstration Signal</p>
          <p className="text-xs text-muted-foreground mt-0.5">{data?.disclaimer ?? "Emerging signal — observed evidence of change, NOT a guaranteed future demand forecast."}</p>
        </div>
      </div>

      {loading ? <LoadingState label="Loading emerging signals…" /> : error ? <ErrorState message={error.message} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.entries ?? []).map((e) => (
            <div key={e.skillId} className="rounded-lg border bg-card p-4 space-y-3 shadow-none">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-sm font-medium">{e.skillName}</p><p className="text-[10px] text-muted-foreground">{e.technologyLink ? `Tech link: ${e.technologyLink}` : "No tech link"}</p></div>
                <StatusPill tone={STATUS_TONE[e.emergenceStatus] ?? "neutral"} dot>{e.emergenceStatus.replace(/_/g, " ")}</StatusPill>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Signal Strength</span><span className="tabular-nums">{e.signalStrength}/100</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${e.signalStrength}%` }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Recent activity</span><br /><span className="tabular-nums font-medium">{e.recentActivity}</span></div>
                <div><span className="text-muted-foreground">Trend velocity</span><br /><span className={`tabular-nums font-medium ${e.trendVelocity > 0 ? "text-status-positive" : e.trendVelocity < 0 ? "text-status-critical" : ""}`}>{e.trendVelocity > 0 ? "+" : ""}{e.trendVelocity}</span></div>
                <div><span className="text-muted-foreground">Persistence</span><br /><span className="tabular-nums font-medium">{Math.round(e.persistence * 100)}%</span></div>
                <div><span className="text-muted-foreground">Sources</span><br /><span className="tabular-nums font-medium">{e.sourceDiversity}</span></div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                <span>Evidence: {e.evidenceCount}</span>
                <span>Confidence: {Math.round(e.confidence * 100)}%</span>
                {e.firstObserved ? <span>First: {new Date(e.firstObserved).toLocaleDateString()}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Evidence Convergence view
// ---------------------------------------------------------------------

export function EvidenceConvergenceView() {
  const [skillId, setSkillId] = React.useState<string>("");
  const { data: skillsData } = useFetch<Paginated<Skill>>("/api/v1/skills?pageSize=100");
  const { data, loading, error } = useFetch<{ jobPosting: { signal: number; direction: string }; employerSurvey: { signal: number; direction: string }; industryConsultation: { signal: number; direction: string }; sectorGrowth: { signal: number; direction: string }; technologyTrend: { signal: number; direction: string }; placementOutcome: { signal: number; direction: string }; overall: string; sourceDiversity: number; evidenceCount: number; uniqueEmployers: number; confidence: number }>(
    skillId ? `/api/v1/market-demand/convergence?skillId=${skillId}` : null,
    [skillId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Convergence"
        description="Cross-source agreement for a skill. If sources conflict → MIXED EVIDENCE. Sources remain individually visible."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />
      <div className="space-y-2 max-w-sm">
        <Label>Skill</Label>
        <Select value={skillId || "_none"} onValueChange={setSkillId}>
          <SelectTrigger><SelectValue placeholder="Choose a skill" /></SelectTrigger>
          <SelectContent>
            {(skillsData?.items ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!skillId ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">Select a skill to view its evidence convergence.</div>
      ) : loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : data ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { k: "Job Postings", v: data.jobPosting },
              { k: "Employer Surveys", v: data.employerSurvey },
              { k: "Industry Consultations", v: data.industryConsultation },
              { k: "Sector Growth", v: data.sectorGrowth },
              { k: "Technology Trends", v: data.technologyTrend },
              { k: "Placement Outcomes", v: data.placementOutcome },
            ].map((s) => (
              <div key={s.k} className="rounded-md border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.k}</span>
                  <StatusPill tone={TREND_TONE[s.v.direction] ?? "neutral"} dot>{s.v.direction}</StatusPill>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, s.v.signal * 3)}%` }} /></div>
                  <span className="text-xs tabular-nums">{s.v.signal}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Overall Convergence" value={<StatusPill tone={data.overall === "CONVERGING" ? "positive" : data.overall === "MIXED" ? "attention" : "neutral"} dot>{data.overall.replace(/_/g, " ")}</StatusPill>} tone={data.overall === "CONVERGING" ? "positive" : "attention"} />
            <MetricCard label="Source Diversity" value={data.sourceDiversity} hint="source types" />
            <MetricCard label="Evidence Count" value={data.evidenceCount} />
            <MetricCard label="Unique Employers" value={data.uniqueEmployers} />
            <MetricCard label="Confidence" value={<StatusPill tone={data.confidence >= 0.7 ? "positive" : data.confidence >= 0.4 ? "info" : "attention"} dot>{Math.round(data.confidence * 100)}%</StatusPill>} />
          </div>

          {data.overall === "MIXED" ? (
            <div className="rounded-md border border-status-attention/40 bg-status-attention/5 p-4 flex items-start gap-3">
              <AlertTriangle className="size-5 text-status-attention mt-0.5" />
              <div>
                <p className="text-sm font-medium text-status-attention">MIXED EVIDENCE</p>
                <p className="text-xs text-muted-foreground mt-1">Sources disagree on direction. The system does not force a single conclusion — individual source observations remain visible above.</p>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Market Trends view (time-series)
// ---------------------------------------------------------------------

export function MarketTrendsView() {
  const [skillId, setSkillId] = React.useState<string>("");
  const { data: skillsData } = useFetch<Paginated<Skill>>("/api/v1/skills?pageSize=100");
  const { data, loading, error } = useFetch<{ series: { period: string; signalValue: number; evidenceCount: number; direction: string }[]; methodology: string }>(
    skillId ? `/api/v1/market-demand/trends?skillId=${skillId}` : null,
    [skillId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Trends"
        description="Time-series of market signals across 12 monthly periods. Missing periods appear as gaps — never fabricated as zeros."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />
      <div className="space-y-2 max-w-sm">
        <Label>Skill</Label>
        <Select value={skillId || "_none"} onValueChange={setSkillId}>
          <SelectTrigger><SelectValue placeholder="Choose a skill" /></SelectTrigger>
          <SelectContent>
            {(skillsData?.items ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!skillId ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">Select a skill to view its trend.</div>
      ) : loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : data ? (
        <>
          <EvidencePanel title="Signal Over Time" source="12 monthly periods">
            {data.series.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <AlertTriangle className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                INSUFFICIENT DATA — no trend observations for this skill.
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const max = Math.max(...data.series.map((p) => p.signalValue), 1);
                  return data.series.map((p) => (
                    <div key={p.period} className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-muted-foreground w-16 shrink-0">{p.period}</span>
                      <div className="flex-1 h-4 rounded bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${(p.signalValue / max) * 100}%` }} /></div>
                      <span className="tabular-nums w-10 text-right font-medium">{p.signalValue}</span>
                      <StatusPill tone={TREND_TONE[p.direction] ?? "neutral"} dot>{p.direction}</StatusPill>
                    </div>
                  ));
                })()}
              </div>
            )}
          </EvidencePanel>
          <p className="text-[11px] text-muted-foreground">{data.methodology}</p>
        </>
      ) : null}
    </div>
  );
}
