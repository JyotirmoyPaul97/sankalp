"use client";

import * as React from "react";
import { BookOpen, Clock, Filter } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill, courseStatusTone } from "@/components/kaushal/status-pill";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState } from "@/components/kaushal/states";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, VisualBar } from "@/components/kaushal/visual-components";
import type { Course, Paginated } from "@/types/domain";

const COVERAGE_WEIGHT: Record<string, number> = {
  NONE: 0, INTRODUCED: 25, REINFORCED: 60, MASTERED: 100,
};

function coverageScore(c: Course): { score: number; counts: { MASTERED: number; REINFORCED: number; INTRODUCED: number; NONE: number } } {
  const sks = c.courseSkills ?? [];
  const counts = { MASTERED: 0, REINFORCED: 0, INTRODUCED: 0, NONE: 0 };
  if (sks.length === 0) return { score: 0, counts };
  let sum = 0;
  for (const s of sks) {
    const lvl = s.coverageLevel ?? "NONE";
    sum += COVERAGE_WEIGHT[lvl] ?? 0;
    counts[lvl as keyof typeof counts] = (counts[lvl as keyof typeof counts] ?? 0) + 1;
  }
  return { score: Math.round(sum / sks.length), counts };
}

export function CoursesView() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("ALL");
  const path = `/api/v1/courses?page=${page}&pageSize=20${
    search ? `&search=${encodeURIComponent(search)}` : ""
  }${status !== "ALL" ? `&status=${status}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<Course>>(path, [search, page, status]);

  const columns: Column<Course>[] = [
    {
      key: "name",
      header: "Course",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <BookOpen className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{c.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{c.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sector",
      header: "Sector",
      cell: (c) => <span className="text-xs text-muted-foreground">{c.sector?.name ?? "—"}</span>,
      width: "180px",
    },
    {
      key: "qualification",
      header: "Qualification",
      cell: (c) => (
        <span className="text-xs text-muted-foreground">{c.qualification?.name ?? "—"}</span>
      ),
      width: "180px",
    },
    {
      key: "coverage",
      header: "Coverage",
      cell: (c) => {
        const { score, counts } = coverageScore(c);
        const tone: "positive" | "info" | "attention" | "critical" | "neutral" =
          score >= 70 ? "positive" : score >= 45 ? "info" : score >= 20 ? "attention" : "critical";
        return (
          <div className="space-y-1 w-32">
            <VisualBar label="" value={score} tone={tone} height="sm" showValue />
            <div className="flex flex-wrap gap-1">
              {counts.MASTERED > 0 ? <span className="text-[9px] rounded-full bg-status-positive/15 text-status-positive px-1.5 py-0.5">{counts.MASTERED} M</span> : null}
              {counts.REINFORCED > 0 ? <span className="text-[9px] rounded-full bg-status-info/15 text-status-info px-1.5 py-0.5">{counts.REINFORCED} R</span> : null}
              {counts.INTRODUCED > 0 ? <span className="text-[9px] rounded-full bg-status-attention/15 text-status-attention px-1.5 py-0.5">{counts.INTRODUCED} I</span> : null}
              {counts.NONE > 0 ? <span className="text-[9px] rounded-full bg-muted text-muted-foreground px-1.5 py-0.5">{counts.NONE} N</span> : null}
            </div>
          </div>
        );
      },
      width: "150px",
    },
    {
      key: "duration",
      header: "Duration",
      cell: (c) => (
        <span className="text-xs inline-flex items-center gap-1 tabular-nums">
          <Clock className="size-3 text-muted-foreground" />
          {c.durationHours}h
        </span>
      ),
      width: "110px",
    },
    {
      key: "skills",
      header: "Skills",
      cell: (c) => <span className="tabular-nums text-sm">{c._count?.courseSkills ?? 0}</span>,
      width: "90px",
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => (
        <StatusPill tone={courseStatusTone(c.status)} dot>
          {c.status.replace("_", " ")}
        </StatusPill>
      ),
      width: "130px",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum & Course Coverage"
        description="Curriculum mapped to sectors and qualifications, with per-course skill coverage. Course relevance profiles and capability gaps are surfaced in Delivery Capability and Gap Intelligence."
        badge={<StatusBadge status="OBSERVED" />}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Input
          placeholder="Search courses by name or code…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="DEPRECATED">Deprecated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Coverage legend */}
      <div className="rounded-md border bg-muted/30 p-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider">Coverage legend</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-status-positive" /> M = Mastered</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-status-info" /> R = Reinforced</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-status-attention" /> I = Introduced</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground" /> N = Not covered</span>
        <span className="ml-auto">Bar = avg coverage across mapped skills.</span>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(c) => c.id}
            loading={loading && !data}
            emptyMessage="No courses match your search."
          />
          {data ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {(data.page - 1) * data.pageSize + 1}–
                {Math.min(data.page * data.pageSize, data.total)} of {data.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent"
                >
                  Previous
                </button>
                <span className="tabular-nums">Page {data.page} / {data.totalPages}</span>
                <button
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
