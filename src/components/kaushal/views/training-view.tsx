"use client";

import * as React from "react";
import { useState } from "react";
import { GraduationCap, BookOpen, Award, MapPin } from "lucide-react";
import { PageHeader, SectionLabel } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Institution, Qualification, Paginated } from "@/types/domain";

export function TrainingView() {
  const [tab, setTab] = useState("institutions");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const instPath = `/api/v1/institutions?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const qualPath = `/api/v1/qualifications?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;

  const instFetch = useFetch<Paginated<Institution>>(tab === "institutions" ? instPath : null, [search, page]);
  const qualFetch = useFetch<Paginated<Qualification>>(tab === "qualifications" ? qualPath : null, [search, page]);

  const institutionCols: Column<Institution>[] = [
    {
      key: "name",
      header: "Institution",
      cell: (i) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <GraduationCap className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{i.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{i.address ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (i) => <span className="text-xs font-mono">{i.institutionType}</span>,
      width: "140px",
    },
    {
      key: "district",
      header: "District",
      cell: (i) => (
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {i.district?.name ?? "—"}
        </span>
      ),
      width: "140px",
    },
    {
      key: "courses",
      header: "Courses",
      cell: (i) => <span className="tabular-nums text-sm">{i._count?.courseInstitutions ?? 0}</span>,
      width: "100px",
    },
    {
      key: "status",
      header: "Status",
      cell: (i) =>
        i.isActive ? (
          <StatusPill tone="positive" dot>Active</StatusPill>
        ) : (
          <StatusPill tone="attention" dot>Inactive</StatusPill>
        ),
      width: "110px",
    },
  ];

  const qualificationCols: Column<Qualification>[] = [
    {
      key: "name",
      header: "Qualification",
      cell: (q) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Award className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{q.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{q.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "level",
      header: "Level",
      cell: (q) => <span className="text-xs">{q.qualificationLevel}</span>,
      width: "160px",
    },
    {
      key: "courses",
      header: "Courses",
      cell: (q) => <span className="tabular-nums text-sm">{q._count?.courses ?? 0}</span>,
      width: "100px",
    },
    {
      key: "description",
      header: "Description",
      cell: (q) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-md">
          {q.description ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Ecosystem"
        description="Institutions, courses and qualifications forming the training-supply foundation. All data is synthetic demonstration data."
        badge={<StatusPill tone="info" dot>Phase 1 — Foundation</StatusPill>}
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="institutions" className="gap-1.5">
            <GraduationCap className="size-3.5" /> Institutions
          </TabsTrigger>
          <TabsTrigger value="qualifications" className="gap-1.5">
            <Award className="size-3.5" /> Qualifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions" className="space-y-4 mt-4">
          <Input
            placeholder="Search institutions…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
          {instFetch.error ? (
            <ErrorState message={instFetch.error.message} onRetry={instFetch.refetch} />
          ) : (
            <DataTable
              columns={institutionCols}
              rows={instFetch.data?.items ?? []}
              rowKey={(i) => i.id}
              loading={instFetch.loading && !instFetch.data}
              emptyMessage="No demonstration institutions match your search."
            />
          )}
          {instFetch.data ? (
            <Pagination data={instFetch.data} page={page} setPage={setPage} />
          ) : null}
        </TabsContent>

        <TabsContent value="qualifications" className="space-y-4 mt-4">
          <Input
            placeholder="Search qualifications…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
          {qualFetch.error ? (
            <ErrorState message={qualFetch.error.message} onRetry={qualFetch.refetch} />
          ) : (
            <DataTable
              columns={qualificationCols}
              rows={qualFetch.data?.items ?? []}
              rowKey={(q) => q.id}
              loading={qualFetch.loading && !qualFetch.data}
              emptyMessage="No demonstration qualifications match your search."
            />
          )}
          {qualFetch.data ? (
            <Pagination data={qualFetch.data} page={page} setPage={setPage} />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Pagination({
  data,
  page,
  setPage,
}: {
  data: Paginated<unknown>;
  page: number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        Showing {(data.page - 1) * data.pageSize + 1}–
        {Math.min(data.page * data.pageSize, data.total)} of {data.total}
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))}
          className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent"
        >
          Previous
        </button>
        <span className="tabular-nums">Page {data.page} / {data.totalPages}</span>
        <button
          disabled={page >= data.totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent"
        >
          Next
        </button>
      </div>
    </div>
  );
}
