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
import type { Course, Paginated } from "@/types/domain";

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
        title="Courses"
        description="Course catalogue mapped to sectors and qualifications. Relevance scores and demand-vs-supply gap analysis arrive in later phases."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
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

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(c) => c.id}
            loading={loading && !data}
            emptyMessage="No demonstration courses match your search."
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
