"use client";

import * as React from "react";
import { User, Target, AlertTriangle, CheckCircle2, TrendingUp, GraduationCap, ArrowRight, Award, FileText, GitBranch } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Paginated } from "@/types/domain";

interface Candidate {
  id: string; name: string; email: string; educationLevel: string | null; experienceYears: number | null;
  district: { name: string } | null; status: string; dataStatus: string;
  _count: { skills: number; targetProfiles: number; skillGaps: number };
}

const READINESS_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  HIGH_READINESS: "positive", MODERATE_READINESS: "info", DEVELOPING: "attention", LOW_READINESS: "critical", INSUFFICIENT_DATA: "neutral",
  READY_FOR_CONSIDERATION: "positive", SIGNIFICANT_GAPS: "critical", INSUFFICIENT_EVIDENCE: "neutral",
};
const GAP_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  ALIGNED: "positive", MISSING_SKILL: "critical", PROFICIENCY_GAP: "attention", STALE_EVIDENCE: "attention", INSUFFICIENT_EVIDENCE: "neutral", PARTIAL_SKILL: "attention", UNKNOWN: "neutral",
};
const PRIORITY_TONE: Record<string, "critical" | "attention" | "info" | "positive" | "neutral"> = {
  CRITICAL: "critical", HIGH: "attention", MEDIUM: "info", LOW: "neutral", INFORMATIONAL: "positive",
};
const MATCH_TONE: Record<string, "positive" | "info" | "attention" | "neutral"> = {
  STRONG_MATCH: "positive", MATCH: "info", PARTIAL_MATCH: "attention", WEAK_MATCH: "attention", INSUFFICIENT_DATA: "neutral",
};

export function CandidateIntelligenceView() {
  const [candidateId, setCandidateId] = React.useState<string>("");
  const { data: candidatesData } = useFetch<Paginated<Candidate>>("/api/v1/candidates/list?pageSize=200");

  React.useEffect(() => {
    if (!candidateId && candidatesData?.items?.length) setCandidateId(candidatesData.items[0].id);
  }, [candidatesData, candidateId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Skill Intelligence"
        description="Evidence-based skill profiles, individual gap analysis, development pathways, and opportunity readiness. NO employment guarantees — market-referenced readiness only."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="space-y-2 max-w-sm">
        <Label>Candidate</Label>
        <Select value={candidateId || "_none"} onValueChange={setCandidateId}>
          <SelectTrigger><SelectValue placeholder="Choose a candidate…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Choose a candidate…</SelectItem>
            {(candidatesData?.items ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} · {c._count.skills} skills · {c._count.skillGaps} gaps</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {candidateId && candidateId !== "_none" ? <CandidateDashboard candidateId={candidateId} /> : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Select a candidate to view their skill intelligence dashboard.
        </div>
      )}
    </div>
  );
}

function CandidateDashboard({ candidateId }: { candidateId: string }) {
  const skillsFetch = useFetch<{ skills: { id: string; currentProficiency: string; proficiencyConfidence: number; evidenceCount: number; freshnessStatus: string; status: string; skill: { name: string; canonicalName: string; category: string | null } }[] }>(`/api/v1/candidates/${candidateId}/skills`);
  const gapsFetch = useFetch<{ gaps: { id: string; gapType: string; gapSeverity: string | null; requiredProficiency: string; candidateProficiency: string | null; evidenceCount: number; freshness: string; status: string; skill: { name: string } | null; jobRole: { title: string } | null }[] }>(`/api/v1/candidates/${candidateId}/gaps`);
  const readinessFetch = useFetch<{ readiness: { id: string; overallReadinessSignal: string; skillCoverage: number; proficiencyAlignment: number; evidenceConfidence: number; criticalGapCount: number; highGapCount: number; moderateGapCount: number; jobRole: { title: string } | null }[] }>(`/api/v1/candidates/${candidateId}/readiness`);
  const prioritiesFetch = useFetch<{ priorities: { id: string; prioritySignal: string; priorityReason: string | null; emergingSignal: string; trainingAvailability: string }[] }>(`/api/v1/candidates/${candidateId}/gap-priorities`);
  const matchesFetch = useFetch<{ matches: { id: string; matchStatus: string; matchConfidence: number; matchReason: string | null; skillCoverage: number; proficiencyAlignment: string; courseRelevance: number; centreReadiness: string; geographicAccess: string; course: { name: string; sector: { name: string } | null } | null }[] }>(`/api/v1/candidates/${candidateId}/course-matches`);
  const pathsFetch = useFetch<{ paths: { id: string; pathwayStatus: string; jobRole: { title: string } | null; steps: { id: string; sequence: number; actionType: string; status: string; objective: string | null; skill: { name: string } | null; course: { name: string } | null }[] }[] }>(`/api/v1/candidates/${candidateId}/development-path`);
  const oppReadinessFetch = useFetch<{ readiness: { id: string; overallReadinessSignal: string; roleReadiness: number; skillReadiness: number; evidenceReadiness: number; criticalGapCount: number; highGapCount: number; jobRole: { title: string } | null }[] }>(`/api/v1/candidates/${candidateId}/opportunity-readiness`);

  const readiness = readinessFetch.data?.readiness[0];
  const oppReadiness = oppReadinessFetch.data?.readiness[0];

  return (
    <div className="space-y-6">
      {/* Readiness overview */}
      {readiness ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Readiness" value={<StatusPill tone={READINESS_TONE[readiness.overallReadinessSignal] ?? "neutral"} dot>{readiness.overallReadinessSignal.replace(/_/g, " ")}</StatusPill>} tone={READINESS_TONE[readiness.overallReadinessSignal] as never} />
            <MetricCard label="Skill Coverage" value={`${Math.round(readiness.skillCoverage * 100)}%`} hint={`${readiness.jobRole?.title ?? "—"}`} />
            <MetricCard label="Critical Gaps" value={readiness.criticalGapCount} tone={readiness.criticalGapCount > 0 ? "critical" : "positive"} />
            <MetricCard label="High Gaps" value={readiness.highGapCount} tone={readiness.highGapCount > 0 ? "attention" : "positive"} />
            <MetricCard label="Evidence Confidence" value={`${Math.round(readiness.evidenceConfidence * 100)}%`} />
          </div>

          {/* Opportunity readiness */}
          {oppReadiness ? (
            <EvidencePanel title="Opportunity Readiness" source="Opportunity Readiness">
              <div className="flex items-center gap-3">
                <StatusPill tone={READINESS_TONE[oppReadiness.overallReadinessSignal] ?? "neutral"} dot>{oppReadiness.overallReadinessSignal.replace(/_/g, " ")}</StatusPill>
                <span className="text-sm text-muted-foreground">Role readiness: {Math.round(oppReadiness.roleReadiness * 100)}% · Evidence: {Math.round(oppReadiness.evidenceReadiness * 100)}%</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Market-referenced readiness signal — NOT a guaranteed hiring outcome. Based on evidence-backed comparison of candidate skills with role requirements.</p>
            </EvidencePanel>
          ) : null}
        </>
      ) : null}

      {/* Skill Passport */}
      <section className="space-y-3">
        <SectionLabel>Skill Passport — Verified Skills</SectionLabel>
        {skillsFetch.loading ? <LoadingState /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(skillsFetch.data?.skills ?? []).slice(0, 9).map((s) => (
              <div key={s.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{s.skill.name}</p>
                  <StatusPill tone={s.status === "ASSESSED" || s.status === "VERIFIED" ? "positive" : s.status === "STALE" || s.status === "INSUFFICIENT_EVIDENCE" ? "attention" : "info"} dot>{s.status}</StatusPill>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><span className="text-muted-foreground">Proficiency:</span> <span className="font-medium">{s.currentProficiency}</span></div>
                  <div><span className="text-muted-foreground">Confidence:</span> <span className="tabular-nums">{Math.round(s.proficiencyConfidence * 100)}%</span></div>
                  <div><span className="text-muted-foreground">Evidence:</span> <span className="tabular-nums">{s.evidenceCount}</span></div>
                  <div><span className="text-muted-foreground">Freshness:</span> <StatusPill tone={s.freshnessStatus === "CURRENT" ? "positive" : s.freshnessStatus === "STALE" ? "attention" : "neutral"}>{s.freshnessStatus}</StatusPill></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Skill Gaps */}
      <section className="space-y-3">
        <SectionLabel>Individual Skill Gaps</SectionLabel>
        {gapsFetch.loading ? <LoadingState /> : gapsFetch.error ? <ErrorState message={gapsFetch.error.message} /> : (
          <DataTable
            columns={[
              { key: "skill", header: "Skill", cell: (g) => <span className="text-sm font-medium">{g.skill?.name ?? "—"}</span> },
              { key: "required", header: "Required", cell: (g) => <span className="text-xs font-medium">{g.requiredProficiency}</span>, width: "100px" },
              { key: "current", header: "Current", cell: (g) => <span className="text-xs">{g.candidateProficiency ?? "—"}</span>, width: "100px" },
              { key: "gap", header: "Gap Type", cell: (g) => <StatusPill tone={GAP_TONE[g.gapType] ?? "neutral"} dot>{g.gapType.replace(/_/g, " ")}</StatusPill>, width: "170px" },
              { key: "severity", header: "Severity", cell: (g) => g.gapSeverity ? <StatusPill tone={PRIORITY_TONE[g.gapSeverity] ?? "neutral"} dot>{g.gapSeverity}</StatusPill> : <span className="text-xs text-muted-foreground">—</span>, width: "100px" },
              { key: "evidence", header: "Evidence", cell: (g) => <span className="tabular-nums text-xs">{g.evidenceCount}</span>, width: "80px" },
              { key: "status", header: "Status", cell: (g) => <StatusPill tone={g.status === "RESOLVED" ? "positive" : g.status === "OPEN" ? "attention" : "neutral"} dot>{g.status}</StatusPill>, width: "100px" },
            ]}
            rows={gapsFetch.data?.gaps ?? []}
            rowKey={(g) => g.id}
            emptyMessage="No skill gaps — all aligned or insufficient data."
          />
        )}
      </section>

      {/* Gap Priorities */}
      <section className="space-y-3">
        <SectionLabel>Gap Priorities</SectionLabel>
        {prioritiesFetch.loading ? <LoadingState /> : (
          <div className="space-y-2">
            {(prioritiesFetch.data?.priorities ?? []).filter((p) => p.prioritySignal !== "INFORMATIONAL").slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <StatusPill tone={PRIORITY_TONE[p.prioritySignal] ?? "neutral"} dot>{p.prioritySignal}</StatusPill>
                  <span className="text-xs text-muted-foreground">{p.priorityReason}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.emergingSignal !== "NONE" && p.emergingSignal !== "INSUFFICIENT_EVIDENCE" ? <StatusPill tone="attention" dot>Emerging</StatusPill> : null}
                  <StatusPill tone={p.trainingAvailability === "AVAILABLE" ? "positive" : "neutral"} dot>{p.trainingAvailability}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Course Matches */}
      <section className="space-y-3">
        <SectionLabel>Recommended Development Actions — Course Matches</SectionLabel>
        {matchesFetch.loading ? <LoadingState /> : (
          <DataTable
            columns={[
              { key: "course", header: "Course", cell: (m) => <div><p className="text-sm font-medium">{m.course?.name ?? "—"}</p><p className="text-[11px] text-muted-foreground">{m.course?.sector?.name ?? "—"}</p></div> },
              { key: "match", header: "Match", cell: (m) => <StatusPill tone={MATCH_TONE[m.matchStatus] ?? "neutral"} dot>{m.matchStatus.replace(/_/g, " ")}</StatusPill>, width: "140px" },
              { key: "conf", header: "Confidence", cell: (m) => (
                <div className="flex items-center gap-2"><div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${m.matchConfidence * 100}%` }} /></div><span className="text-xs tabular-nums">{Math.round(m.matchConfidence * 100)}%</span></div>
              ), width: "100px" },
              { key: "relevance", header: "Relevance", cell: (m) => <span className="text-xs tabular-nums">{Math.round(m.courseRelevance)}</span>, width: "80px" },
              { key: "readiness", header: "Centre", cell: (m) => <span className="text-xs">{m.centreReadiness.replace(/_/g, " ")}</span>, width: "120px" },
              { key: "geo", header: "Access", cell: (m) => <span className="text-xs">{m.geographicAccess}</span>, width: "80px" },
            ]}
            rows={matchesFetch.data?.matches ?? []}
            rowKey={(m) => m.id}
            emptyMessage="No course matches — insufficient data."
          />
        )}
        <p className="text-[11px] text-muted-foreground">Each match is backed by course relevance, centre readiness, and candidate gap evidence. NO guaranteed outcomes — development suggestions only.</p>
      </section>

      {/* Development Pathway */}
      <section className="space-y-3">
        <SectionLabel>Personalized Development Pathway</SectionLabel>
        {pathsFetch.loading ? <LoadingState /> : (
          <div className="space-y-3">
            {(pathsFetch.data?.paths ?? []).map((path) => (
              <div key={path.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-primary" />
                    <span className="text-sm font-medium">{path.jobRole?.title ?? "—"}</span>
                  </div>
                  <StatusPill tone={path.pathwayStatus === "ACTIVE" ? "positive" : "neutral"} dot>{path.pathwayStatus}</StatusPill>
                </div>
                <div className="space-y-2">
                  {path.steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-muted-foreground w-8">{String(step.sequence).padStart(2, "0")}</span>
                      <StatusPill tone={step.status === "COMPLETED" ? "positive" : step.status === "IN_PROGRESS" ? "info" : "neutral"} dot>{step.actionType}</StatusPill>
                      <span className="flex-1">{step.objective ?? "—"}</span>
                      {step.skill ? <span className="text-muted-foreground">{step.skill.name}</span> : null}
                      {step.course ? <span className="text-muted-foreground">→ {step.course.name}</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
