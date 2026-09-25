"use client";

import * as React from "react";
import { ArrowRight, GraduationCap, Wrench, Users, Building2, CheckCircle2, AlertTriangle, Gauge } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { LoadingState, ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";

const READINESS_TONE: Record<string, "positive" | "info" | "attention" | "critical" | "neutral"> = {
  READY: "positive", PARTIALLY_READY: "attention", LIMITED_READINESS: "critical", INSUFFICIENT_DATA: "neutral",
  COURSE_DELIVERY_READY: "positive", ALIGNED: "positive", AVAILABLE: "positive", ADEQUATE: "positive",
  PARTIAL: "attention", PARTIALLY_READY: "attention", PARTIALLY_OPERATIONAL: "attention",
  LIMITED: "critical", LIMITED_READINESS: "critical", LOWER_THAN_REQUIRED: "critical",
  INSUFFICIENT_DATA: "neutral",
};
const ALIGN_TONE: Record<string, "positive" | "info" | "attention" | "neutral"> = {
  STRONGLY_ALIGNED: "positive", ALIGNED: "positive", FULL_COVERAGE: "positive",
  PARTIALLY_ALIGNED: "info", PARTIAL_COVERAGE: "info", PARTIAL_ALIGNMENT: "info",
  WEAKLY_ALIGNED: "attention", NOT_IDENTIFIED: "attention", NO_CONFIDENT_ALIGNMENT: "attention",
  INSUFFICIENT_DATA: "neutral",
};

export function DeliveryCapabilityView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Delivery Capability"
        description="Assess whether training centres have the curriculum, trainers, equipment and capacity required to deliver market-relevant skills. Diagnostic — not recommendations."
        badge={<StatusPill tone="info" dot>Phase 6 — Delivery Capability</StatusPill>}
      />

      {/* Chain banner */}
      <div className="rounded-lg border bg-card p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {[
          { icon: <Gauge className="size-5 text-primary" />, label: "Course Relevance", desc: "Phase 6 Part 1" },
          { icon: <GraduationCap className="size-5 text-primary" />, label: "Curriculum", desc: "Coverage + freshness" },
          { icon: <Users className="size-5 text-primary" />, label: "Trainers", desc: "Proficiency + capacity" },
          { icon: <Wrench className="size-5 text-primary" />, label: "Equipment", desc: "Availability + condition" },
          { icon: <Building2 className="size-5 text-primary" />, label: "Centre Readiness", desc: "Combined delivery" },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-1 text-center">
              {s.icon}
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.desc}</p>
            </div>
            {i < 4 ? <ArrowRight className="size-4 text-muted-foreground" /> : null}
          </React.Fragment>
        ))}
      </div>

      <CourseRelevanceSection />
      <CentreReadinessSection />
      <DeliveryGapsSection />
    </div>
  );
}

function CourseRelevanceSection() {
  const { data, loading, error } = useFetch<{ courses: { id: string; courseId: string; course: { name: string; sector: { name: string } | null }; jobRole: { title: string } | null; relevanceScore: number; coverageStatus: string; proficiencyAlignment: string; curriculumFreshness: string; evidenceConfidence: number }[] }>("/api/v1/relevance/courses");
  const cols: Column<typeof data extends { courses: infer T } ? T extends Array<infer U> ? U : never : never>[] = [
    { key: "course", header: "Course", cell: (r) => <div><p className="text-sm font-medium">{r.course.name}</p><p className="text-[11px] text-muted-foreground">{r.jobRole?.title ?? "—"}</p></div> },
    { key: "score", header: "Relevance", cell: (r) => (
      <div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${r.relevanceScore}%` }} /></div><span className="text-xs tabular-nums">{Math.round(r.relevanceScore)}</span></div>
    ), width: "120px" },
    { key: "coverage", header: "Coverage", cell: (r) => <StatusPill tone={ALIGN_TONE[r.coverageStatus] ?? "neutral"} dot>{r.coverageStatus.replace(/_/g, " ")}</StatusPill>, width: "160px" },
    { key: "prof", header: "Proficiency", cell: (r) => <StatusPill tone={r.proficiencyAlignment === "ALIGNED" ? "positive" : r.proficiencyAlignment === "LOWER_THAN_MARKET" ? "critical" : "info"} dot>{r.proficiencyAlignment.replace(/_/g, " ")}</StatusPill>, width: "150px" },
    { key: "fresh", header: "Freshness", cell: (r) => <StatusPill tone={r.curriculumFreshness === "RECENT" || r.curriculumFreshness === "CURRENT" ? "positive" : r.curriculumFreshness === "AGING" || r.curriculumFreshness === "STALE" ? "attention" : "neutral"} dot>{r.curriculumFreshness}</StatusPill>, width: "100px" },
    { key: "conf", header: "Confidence", cell: (r) => <span className="text-xs tabular-nums">{Math.round(r.evidenceConfidence * 100)}%</span>, width: "80px" },
  ];
  return (
    <section className="space-y-3">
      <SectionLabel>Course Relevance Signals</SectionLabel>
      {loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : (
        <DataTable columns={cols} rows={(data?.courses ?? []).slice(0, 15)} rowKey={(r) => r.id} emptyMessage="No relevance profiles." />
      )}
    </section>
  );
}

function CentreReadinessSection() {
  const { data, loading, error } = useFetch<{ readiness: { id: string; centreReadinessSignal: string; confidence: number; trainingCentre: { name: string; district: { name: string } | null; institution: { name: string } | null } }[] }>("/api/v1/capability/readiness");
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} />;
  const ready = (data?.readiness ?? []).filter((r) => r.centreReadinessSignal === "READY").length;
  const partial = (data?.readiness ?? []).filter((r) => r.centreReadinessSignal === "PARTIALLY_READY").length;
  const limited = (data?.readiness ?? []).filter((r) => r.centreReadinessSignal === "LIMITED_READINESS").length;
  return (
    <section className="space-y-3">
      <SectionLabel>Centre Delivery Readiness</SectionLabel>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Ready" value={ready} tone="positive" icon={<CheckCircle2 className="size-4" />} />
        <MetricCard label="Partially Ready" value={partial} tone="attention" icon={<AlertTriangle className="size-4" />} />
        <MetricCard label="Limited Readiness" value={limited} tone="critical" icon={<AlertTriangle className="size-4" />} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data?.readiness ?? []).slice(0, 9).map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-3 space-y-1.5">
            <p className="text-sm font-medium truncate">{r.trainingCentre.name}</p>
            <p className="text-[11px] text-muted-foreground">{r.trainingCentre.district?.name ?? "—"} · {r.trainingCentre.institution?.name ?? "—"}</p>
            <div className="flex items-center justify-between">
              <StatusPill tone={READINESS_TONE[r.centreReadinessSignal] ?? "neutral"} dot>{r.centreReadinessSignal.replace(/_/g, " ")}</StatusPill>
              <span className="text-[11px] text-muted-foreground tabular-nums">{Math.round(r.confidence * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeliveryGapsSection() {
  const { data, loading, error } = useFetch<{ gaps: { id: string; overallCapabilityStatus: string; confidence: number; curriculumStatus: string; trainerStatus: string; equipmentStatus: string; capacityStatus: string; course: { name: string } | null; trainingCentre: { name: string; district: { name: string } | null } | null }[] }>("/api/v1/capability/gaps");
  const cols: Column<typeof data extends { gaps: infer T } ? T extends Array<infer U> ? U : never : never>[] = [
    { key: "course", header: "Course", cell: (g) => <div><p className="text-sm font-medium">{g.course?.name ?? "—"}</p><p className="text-[11px] text-muted-foreground">{g.trainingCentre?.name ?? "—"}</p></div> },
    { key: "curr", header: "Curriculum", cell: (g) => <StatusPill tone={READINESS_TONE[g.curriculumStatus] ?? "neutral"} dot>{g.curriculumStatus.replace(/_/g, " ")}</StatusPill>, width: "120px" },
    { key: "trainer", header: "Trainer", cell: (g) => <StatusPill tone={READINESS_TONE[g.trainerStatus] ?? "neutral"} dot>{g.trainerStatus.replace(/_/g, " ")}</StatusPill>, width: "120px" },
    { key: "equip", header: "Equipment", cell: (g) => <StatusPill tone={READINESS_TONE[g.equipmentStatus] ?? "neutral"} dot>{g.equipmentStatus.replace(/_/g, " ")}</StatusPill>, width: "120px" },
    { key: "cap", header: "Capacity", cell: (g) => <StatusPill tone={READINESS_TONE[g.capacityStatus] ?? "neutral"} dot>{g.capacityStatus.replace(/_/g, " ")}</StatusPill>, width: "100px" },
    { key: "overall", header: "Readiness", cell: (g) => <StatusPill tone={READINESS_TONE[g.overallCapabilityStatus] ?? "neutral"} dot>{g.overallCapabilityStatus.replace(/_/g, " ")}</StatusPill>, width: "170px" },
    { key: "conf", header: "Confidence", cell: (g) => <span className="text-xs tabular-nums">{Math.round(g.confidence * 100)}%</span>, width: "80px" },
  ];
  return (
    <section className="space-y-3">
      <SectionLabel>Delivery Capability Gaps</SectionLabel>
      {loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : (
        <DataTable columns={cols} rows={(data?.gaps ?? []).slice(0, 15)} rowKey={(g) => g.id} emptyMessage="No capability gaps." />
      )}
      <p className="text-[11px] text-muted-foreground">Each gap signal compares curriculum alignment, trainer proficiency, equipment availability, and capacity. Dimensions kept separate — never collapsed into one opaque score. Diagnostic intelligence only — NO procurement recommendations.</p>
    </section>
  );
}
