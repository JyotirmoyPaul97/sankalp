"use client";

import * as React from "react";
import {
  Building2,
  Layers,
  Briefcase,
  Sparkles,
  BookOpen,
  Users,
  Database,
  ArrowRight,
  Network,
} from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { MetricCard } from "@/components/kaushal/metric-card";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { ArchitectureFlow } from "@/components/kaushal/architecture-flow";
import { StatusPill } from "@/components/kaushal/status-pill";
import { SourceBadge } from "@/components/kaushal/source-badge";
import { useFetch } from "@/hooks/use-fetch";
import { LoadingState } from "@/components/kaushal/states";
import type { PlatformMeta, DataSource, Paginated } from "@/types/domain";
import { useNav } from "@/store/app-store";

export function OverviewView() {
  const { data: meta, loading } = useFetch<PlatformMeta>("/api/v1/meta");
  const { data: sourcesData } = useFetch<Paginated<DataSource>>("/api/v1/data-sources?pageSize=5");
  const setActiveView = useNav((s) => s.setActiveView);

  const counts = meta?.counts ?? {};
  const metrics = [
    { label: "Demo Districts", value: counts.districts ?? 0, hint: "Pune · Nashik · Nagpur", icon: <Building2 className="size-4" />, tone: "info" as const, view: "districts" },
    { label: "Demo Sectors", value: counts.sectors ?? 0, hint: "Mfg · Automotive · IT", icon: <Layers className="size-4" />, tone: "default" as const, view: "training" },
    { label: "Demo Job Roles", value: counts.jobRoles ?? 0, hint: "Canonical role catalogue", icon: <Briefcase className="size-4" />, tone: "default" as const, view: "training" },
    { label: "Demo Skills", value: counts.skills ?? 0, hint: "Technical · Digital · Safety", icon: <Sparkles className="size-4" />, tone: "default" as const, view: "skills" },
    { label: "Demo Courses", value: counts.courses ?? 0, hint: "Active & under review", icon: <BookOpen className="size-4" />, tone: "default" as const, view: "courses" },
    { label: "Demo Employers", value: counts.employers ?? 0, hint: "Synthetic demonstration", icon: <Users className="size-4" />, tone: "default" as const, view: "districts" },
  ];

  const flow = [
    { label: "Demand Signals", caption: "Job postings, surveys, sector growth" },
    { label: "Skill Intelligence", caption: "Canonical skills & roles" },
    { label: "Training Supply", caption: "Institutions, courses, capacity" },
    { label: "Gap Analysis", caption: "Demand vs. supply comparison" },
    { label: "Policy Decisions", caption: "Simulate & prioritise interventions" },
    { label: "Outcomes", caption: "Placement & feedback loop" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maharashtra Skill Intelligence Overview"
        description="Monitor the evolving relationship between labour-market demand and training capacity."
        badge={
          <StatusPill tone="attention" dot>
            Foundation / Synthetic Demonstration Data
          </StatusPill>
        }
      />

      {/* Foundation disclaimer */}
      <div className="rounded-lg border border-status-attention/30 bg-status-attention/5 px-4 py-3 text-sm text-foreground/80 flex items-start gap-3">
        <div className="size-2 rounded-full bg-status-attention mt-1.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Current View: Foundation / Synthetic Demonstration Data</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Phase 1 establishes the technical and UX foundation. All figures shown derive from
            synthetic demonstration data and are not actual Maharashtra Government statistics.
            Labour-market intelligence, gap analysis, policy simulation and outcomes arrive in later phases.
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Foundation Metrics</SectionLabel>
          <span className="text-[11px] text-muted-foreground">Derived from seeded demonstration data</span>
        </div>
        {loading ? (
          <LoadingState label="Loading foundation metrics…" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {metrics.map((m) => (
              <button
                key={m.label}
                onClick={() => setActiveView(m.view)}
                className="text-left transition-transform hover:-translate-y-0.5"
              >
                <MetricCard
                  label={m.label}
                  value={m.value}
                  hint={m.hint}
                  icon={m.icon}
                  tone={m.tone}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Architecture preview + data provenance */}
      <section className="grid lg:grid-cols-3 gap-6">
        <EvidencePanel
          title="KAUSHAL DRISHTI Intelligence Architecture"
          source="Conceptual"
          className="lg:col-span-2"
        >
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            The full intelligence flow below is a conceptual preview. Phase 1+2 implement the
            foundation (entities, taxonomy, provenance, ingestion). Analytical layers activate in later phases.
          </p>
          <ArchitectureFlow nodes={flow} />
        </EvidencePanel>

        <EvidencePanel
          title="Data Provenance"
          source="Data Sources"
          lastUpdated="Phase 1 seed"
        >
          <div className="space-y-2">
            {sourcesData?.items.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.sourceType}</p>
                </div>
                <SourceBadge status={s.dataStatus} />
              </div>
            ))}
            {!sourcesData ? (
              <p className="text-xs text-muted-foreground">Loading sources…</p>
            ) : null}
            <button
              onClick={() => setActiveView("data-sources")}
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              View all data sources <ArrowRight className="size-3" />
            </button>
          </div>
        </EvidencePanel>
      </section>

      {/* Data Health section (Phase 2) */}
      <DataHealthSection />

      {/* Knowledge Foundation section (Phase 3) */}
      <KnowledgeFoundationSection />

      {/* Phase roadmap */}
      <section className="space-y-3">
        <SectionLabel>Phase Roadmap</SectionLabel>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { p: "Phase 1", t: "Foundation & Data Model", d: "Entities, taxonomy, provenance, RBAC, dashboard shell.", active: true },
            { p: "Phase 2", t: "Data & Evidence Ingestion", d: "Trusted ingestion layer: CSV/JSON, validation, dedupe, quality scoring, provenance, audit.", active: true },
            { p: "Phase 3", t: "Knowledge + Competency Foundation", d: "Skill knowledge graph, aliases, relations, clusters, role/course competency profiles.", active: true },
            { p: "Phase 4", t: "Labour-Market Intelligence", d: "Job-posting signals, employer surveys, sector growth.", active: false },
            { p: "Phase 7", t: "Employer Validation", d: "Structured employer demand-validation workflows.", active: false },
            { p: "Phase 9", t: "District Action Plans", d: "Generate district-level training plans from evidence.", active: false },
            { p: "Phase 11", t: "Policy Simulation Engine", d: "Compare policy interventions before implementation.", active: false },
            { p: "Phase 12", t: "Outcome Feedback", d: "Placement & outcome learning feeding back into planning.", active: false },
          ].map((r) => (
            <div key={r.p} className="rounded-lg border bg-card p-4 space-y-2 shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{r.p}</span>
                <StatusPill tone={r.active ? "positive" : "neutral"} dot>
                  {r.active ? "Active" : "Planned"}
                </StatusPill>
              </div>
              <p className="text-sm font-medium">{r.t}</p>
              <p className="text-xs text-muted-foreground leading-snug">{r.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DataHealthSection() {
  const { data: meta, loading } = useFetch<PlatformMeta>("/api/v1/meta");
  const setActiveView = useNav((s) => s.setActiveView);
  const dh = meta?.dataHealth;
  if (!dh) return null;

  const metrics = [
    { label: "Data Sources", value: meta?.counts.dataSources ?? 0, hint: `${dh.activeSources} active`, tone: "info" as const, view: "data-sources" },
    { label: "Recent Imports", value: dh.recentImports, hint: "last 30 days", tone: "default" as const, view: "import-batches" },
    { label: "Records Ingested", value: dh.totalIngested, hint: "across all evidence", tone: "positive" as const, view: "records-explorer" },
    { label: "Avg Quality", value: `${dh.avgQuality}%`, hint: `${dh.totalBatches} batches`, tone: dh.avgQuality >= 85 ? "positive" : "attention", view: "data-quality" },
  ];

  const breakdown = [
    { k: "Job Postings", v: dh.jobPostings, entity: "job_posting" },
    { k: "Employer Surveys", v: dh.employerSurveys, entity: "employer_survey" },
    { k: "Consultations", v: dh.industryConsultations, entity: "industry_consultation" },
    { k: "Sector Growth", v: dh.sectorGrowth, entity: "sector_growth" },
    { k: "Placements", v: dh.placementOutcomes, entity: "placement_outcome" },
    { k: "Tech Trends", v: dh.technologyTrends, entity: "technology_trend" },
  ];
  const max = Math.max(...breakdown.map((b) => b.v), 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Data Health</SectionLabel>
        <span className="text-[11px] text-muted-foreground">Phase 2 — all values derived from DB, never hard-coded</span>
      </div>
      {loading ? (
        <LoadingState label="Loading data health…" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <button key={m.label} onClick={() => setActiveView(m.view)} className="text-left transition-transform hover:-translate-y-0.5">
                <MetricCard label={m.label} value={m.value} hint={m.hint} tone={m.tone} />
              </button>
            ))}
          </div>

          <EvidencePanel title="Ingested Evidence Breakdown" source="Ingestion" lastUpdated="live">
            <div className="space-y-2.5">
              {breakdown.map((b) => (
                <button
                  key={b.k}
                  onClick={() => setActiveView("records-explorer")}
                  className="block w-full text-left"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{b.k}</span>
                    <span className="tabular-nums font-medium">{b.v}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${(b.v / max) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <StatusPill tone="info" dot>SYNTHETIC / MODELLED / DEMO</StatusPill>
              <span className="text-[11px] text-muted-foreground">No real government data ingested yet.</span>
            </div>
          </EvidencePanel>
        </>
      )}
    </section>
  );
}

function KnowledgeFoundationSection() {
  const { data: meta } = useFetch<PlatformMeta>("/api/v1/meta");
  const setActiveView = useNav((s) => s.setActiveView);
  const kh = meta?.knowledgeHealth;
  if (!kh) return null;

  const metrics = [
    { label: "Skill Aliases", value: kh.skillAliases, hint: "alternate surface forms", tone: "info" as const, view: "skill-intelligence" },
    { label: "Skill Relations", value: kh.skillRelations, hint: "graph edges", tone: "default" as const, view: "skill-intelligence" },
    { label: "Skill Clusters", value: kh.skillClusters, hint: "thematic groupings", tone: "default" as const, view: "skill-intelligence" },
    { label: "Role Competencies", value: kh.roleCompetencies, hint: "expected proficiencies", tone: "positive" as const, view: "competency-framework" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Knowledge Foundation</SectionLabel>
        <span className="text-[11px] text-muted-foreground">Phase 3 — skill knowledge graph + competency profiles</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <button key={m.label} onClick={() => setActiveView(m.view)} className="text-left transition-transform hover:-translate-y-0.5">
            <MetricCard label={m.label} value={m.value} hint={m.hint} tone={m.tone} icon={<Network className="size-4" />} />
          </button>
        ))}
      </div>
      <EvidencePanel title="Knowledge Graph Foundation" source="Phase 3" lastUpdated="deterministic">
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          Phase 3 builds the skill knowledge graph: canonical skills + aliases (so "PLC", "Programmable Logic Controller", "P.L.C." all resolve to one canonical entity), explicit relations (PREREQUISITE / RELATED_TO / BROADER_THAN), and thematic clusters. The competency framework models what proficiency each role expects (AWARENESS → EXPERT) and what each course confers (INTRODUCED → MASTERED).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="info" dot>NO embeddings</StatusPill>
          <StatusPill tone="info" dot>NO ML</StatusPill>
          <StatusPill tone="attention" dot>NO demand intelligence (Phase 4)</StatusPill>
          <StatusPill tone="attention" dot>NO gap analysis (later phase)</StatusPill>
        </div>
      </EvidencePanel>
    </section>
  );
}
