"use client";

import * as React from "react";
import { GraduationCap, BookOpen, GitCompare, Target } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { JobRole, Course, Paginated, RoleCompetencyProfile, CourseCompetencyProfile, CompetencyAlignment } from "@/types/domain";

const PROFICIENCY_TONE: Record<string, "neutral" | "info" | "positive" | "attention"> = {
  AWARENESS: "neutral", WORKING: "info", PROFICIENT: "positive", EXPERT: "attention",
};
const COVERAGE_TONE: Record<string, "neutral" | "info" | "positive" | "attention"> = {
  NONE: "neutral", INTRODUCED: "info", REINFORCED: "positive", MASTERED: "attention",
};
const GAP_TONE: Record<string, "positive" | "info" | "attention" | "critical"> = {
  COVERED: "positive", EXCEEDS: "info", SHORTFALL: "attention", NOT_TAUGHT: "critical",
};

export function CompetencyFrameworkView() {
  const [tab, setTab] = React.useState<"role" | "course" | "alignment">("role");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Competency Framework"
        description="Structural competency profiles: what proficiency each role expects and what each course confers."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="flex items-center gap-2">
        {[
          { id: "role", label: "Role Profile", icon: <GraduationCap className="size-3.5" /> },
          { id: "course", label: "Course Profile", icon: <BookOpen className="size-3.5" /> },
          { id: "alignment", label: "Alignment", icon: <GitCompare className="size-3.5" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${tab === t.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/40"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "role" ? <RoleProfilePanel /> : null}
      {tab === "course" ? <CourseProfilePanel /> : null}
      {tab === "alignment" ? <AlignmentPanel /> : null}
    </div>
  );
}

function RoleProfilePanel() {
  const { data: rolesData } = useFetch<Paginated<JobRole>>("/api/v1/job-roles?pageSize=100");
  const [roleId, setRoleId] = React.useState<string | null>(null);
  React.useEffect(() => { if (!roleId && rolesData?.items?.length) setRoleId(rolesData.items[0].id); }, [rolesData, roleId]);
  const { data, loading, error } = useFetch<{ profile: RoleCompetencyProfile }>(roleId ? `/api/v1/job-roles/${roleId}/competency` : null, [roleId]);

  const cols: Column<RoleCompetencyProfile["competencies"][number]>[] = [
    { key: "skill", header: "Skill", cell: (c) => (
      <div className="flex items-center gap-2">
        <Target className="size-4 text-muted-foreground" />
        <div><p className="text-sm font-medium">{c.skillName}</p><p className="text-[11px] text-muted-foreground font-mono">{c.canonicalName}</p></div>
      </div>
    )},
    { key: "category", header: "Category", cell: (c) => <span className="text-xs text-muted-foreground">{c.category ?? "—"}</span>, width: "120px" },
    { key: "importance", header: "Importance", cell: (c) => <span className="tabular-nums text-sm">{c.importance}/5</span>, width: "100px" },
    { key: "proficiency", header: "Expected Proficiency", cell: (c) => <StatusPill tone={PROFICIENCY_TONE[c.proficiencyExpected] ?? "neutral"} dot>{c.proficiencyExpected}</StatusPill>, width: "180px" },
  ];

  return (
    <div className="grid lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={roleId ?? ""} onValueChange={setRoleId}>
          <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
          <SelectContent>
            {(rolesData?.items ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {data?.profile ? (
          <div className="space-y-2 pt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">By proficiency</p>
            {(Object.entries(data.profile.byProficiency) as [string, number][]).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <StatusPill tone={PROFICIENCY_TONE[k] ?? "neutral"} dot>{k}</StatusPill>
                <span className="tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="lg:col-span-3">
        {loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : data?.profile ? (
          <EvidencePanel title={`${data.profile.roleTitle} — Expected Competencies`} source={data.profile.sectorName ?? "—"} confidence="high">
            <DataTable columns={cols} rows={data.profile.competencies} rowKey={(c) => c.skillId} emptyMessage="No competencies defined." />
          </EvidencePanel>
        ) : null}
      </div>
    </div>
  );
}

function CourseProfilePanel() {
  const { data: coursesData } = useFetch<Paginated<Course>>("/api/v1/courses?pageSize=100");
  const [courseId, setCourseId] = React.useState<string | null>(null);
  React.useEffect(() => { if (!courseId && coursesData?.items?.length) setCourseId(coursesData.items[0].id); }, [coursesData, courseId]);
  const { data, loading, error } = useFetch<{ profile: CourseCompetencyProfile }>(courseId ? `/api/v1/courses/${courseId}/competency` : null, [courseId]);

  const cols: Column<CourseCompetencyProfile["competencies"][number]>[] = [
    { key: "skill", header: "Skill", cell: (c) => <div><p className="text-sm font-medium">{c.skillName}</p><p className="text-[11px] text-muted-foreground font-mono">{c.canonicalName}</p></div> },
    { key: "category", header: "Category", cell: (c) => <span className="text-xs text-muted-foreground">{c.category ?? "—"}</span>, width: "120px" },
    { key: "coverage", header: "Coverage", cell: (c) => <StatusPill tone={COVERAGE_TONE[c.coverage] ?? "neutral"} dot>{c.coverage}</StatusPill>, width: "140px" },
    { key: "confers", header: "Confers Proficiency", cell: (c) => <StatusPill tone={PROFICIENCY_TONE[c.proficiencyConfers] ?? "neutral"} dot>{c.proficiencyConfers}</StatusPill>, width: "180px" },
  ];

  return (
    <div className="grid lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label>Course</Label>
        <Select value={courseId ?? ""} onValueChange={setCourseId}>
          <SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger>
          <SelectContent>
            {(coursesData?.items ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {data?.profile ? (
          <div className="space-y-2 pt-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">By coverage</p>
            {(Object.entries(data.profile.byCoverage) as [string, number][]).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <StatusPill tone={COVERAGE_TONE[k] ?? "neutral"} dot>{k}</StatusPill>
                <span className="tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="lg:col-span-3">
        {loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : data?.profile ? (
          <EvidencePanel title={`${data.profile.courseName} — Taught Competencies`} source={data.profile.sectorName ?? "—"} confidence="high">
            <DataTable columns={cols} rows={data.profile.competencies} rowKey={(c) => c.skillId} emptyMessage="No course-skill mappings." />
          </EvidencePanel>
        ) : null}
      </div>
    </div>
  );
}

function AlignmentPanel() {
  const { data: rolesData } = useFetch<Paginated<JobRole>>("/api/v1/job-roles?pageSize=100");
  const { data: coursesData } = useFetch<Paginated<Course>>("/api/v1/courses?pageSize=100");
  const [roleId, setRoleId] = React.useState<string | null>(null);
  const [courseId, setCourseId] = React.useState<string | null>(null);

  const { data, loading, error } = useFetch<{ alignment: CompetencyAlignment[] | null }>(
    roleId && courseId ? `/api/v1/courses/${courseId}/competency?alignWithRoleId=${roleId}` : null,
    [roleId, courseId],
  );

  const cols: Column<CompetencyAlignment>[] = [
    { key: "skill", header: "Skill", cell: (a) => <span className="text-sm font-medium">{a.skillName}</span> },
    { key: "expected", header: "Role Expects", cell: (a) => <StatusPill tone={PROFICIENCY_TONE[a.expected] ?? "neutral"} dot>{a.expected}</StatusPill>, width: "150px" },
    { key: "conferred", header: "Course Confers", cell: (a) => a.conferred ? <StatusPill tone={PROFICIENCY_TONE[a.conferred] ?? "neutral"} dot>{a.conferred}</StatusPill> : <span className="text-xs text-muted-foreground">—</span>, width: "150px" },
    { key: "gap", header: "Alignment", cell: (a) => <StatusPill tone={GAP_TONE[a.gap] ?? "neutral"} dot>{a.gap.replace(/_/g, " ")}</StatusPill>, width: "140px" },
    { key: "rank", header: "Δ Rank", cell: (a) => <span className={`tabular-nums text-xs ${a.gapRank > 0 ? "text-status-positive" : a.gapRank < 0 ? "text-status-critical" : "text-muted-foreground"}`}>{a.gapRank > 0 ? "+" : ""}{a.gapRank}</span>, width: "80px" },
  ];

  const summary = data?.alignment?.reduce(
    (acc, a) => { acc[a.gap] = (acc[a.gap] ?? 0) + 1; return acc; },
    { COVERED: 0, EXCEEDS: 0, SHORTFALL: 0, NOT_TAUGHT: 0 } as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Course</Label>
          <Select value={courseId ?? ""} onValueChange={setCourseId}>
            <SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger>
            <SelectContent>
              {(coursesData?.items ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={roleId ?? ""} onValueChange={setRoleId}>
            <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
            <SelectContent>
              {(rolesData?.items ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {summary ? (
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(summary).map(([k, v]) => (
            <div key={k} className="rounded-md border p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.replace(/_/g, " ")}</p>
              <p className={`text-xl font-semibold tabular-nums ${k === "COVERED" || k === "EXCEEDS" ? "text-status-positive" : k === "NOT_TAUGHT" ? "text-status-critical" : "text-status-attention"}`}>{v}</p>
            </div>
          ))}
        </div>
      ) : null}
      {!roleId || !courseId ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          Select both a course and a role to compare competencies.
        </div>
      ) : loading ? <LoadingState /> : error ? <ErrorState message={error.message} /> : (
        <DataTable columns={cols} rows={data?.alignment ?? []} rowKey={(a) => a.skillId} emptyMessage="No overlap between course and role." />
      )}
      <p className="text-[11px] text-muted-foreground">
        Structural alignment comparison (proficiency rank differences). Demand-weighted gap analysis available in Gap Intelligence.
      </p>
    </div>
  );
}
