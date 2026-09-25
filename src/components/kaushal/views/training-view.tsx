"use client";

import * as React from "react";
import { useState } from "react";
import { GraduationCap, BookOpen, Award, MapPin, ArrowRight, Building2, Layers3 } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill } from "@/components/kaushal/status-pill";
import { MetricCard } from "@/components/kaushal/metric-card";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/kaushal/visual-components";
import { MaharashtraIntelligenceBackground } from "@/components/kaushal/maharashtra-background";
import { useNav } from "@/store/app-store";
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
  const setActiveView = useNav((s) => s.setActiveView);

  const instPath = `/api/v1/institutions?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const qualPath = `/api/v1/qualifications?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const coursesPath = "/api/v1/courses?pageSize=1";

  const instFetch = useFetch<Paginated<Institution>>(tab === "institutions" ? instPath : null, [search, page]);
  const qualFetch = useFetch<Paginated<Qualification>>(tab === "qualifications" ? qualPath : null, [search, page]);
  const coursesFetch = useFetch<Paginated<{ id: string; name: string }>>(coursesPath);

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
    <div className="space-y-6 relative">
      {/* Subtle workspace background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-xl opacity-[0.05]">
        <MaharashtraIntelligenceBackground variant="training" />
      </div>

      <PageHeader
        title="Training Ecosystem"
        description="The institutions, qualifications, and courses that form the state's training-supply foundation. Coverage and capability gaps are surfaced in Delivery Capability."
        badge={<StatusBadge status="OBSERVED" />}
      />

      {/* Insight strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Institutions" value={instFetch.data?.total ?? "—"} icon={<Building2 className="size-4" />} tone="info" />
        <MetricCard label="Qualifications" value={qualFetch.data?.total ?? "—"} icon={<Award className="size-4" />} tone="info" />
        <MetricCard label="Courses" value={coursesFetch.data?.total ?? "—"} icon={<BookOpen className="size-4" />} tone="info" />
        <MetricCard label="Coverage Insight" value={<span className="text-sm font-semibold">Curriculum ↔ Demand</span>} icon={<Layers3 className="size-4" />} hint="See Delivery Capability for the chain." tone="default" />
      </div>

      {/* Capability chain visual — Market → Curriculum → Trainer → Equipment → Capacity */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Training Supply Chain</h3>
          <button onClick={() => setActiveView("delivery-capability")} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Open Delivery Capability <ArrowRight className="size-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { label: "Market Demand", value: "What industry needs", tone: "text-status-attention", icon: <GraduationCap className="size-4" /> },
            { label: "Curriculum", value: "Course coverage", tone: "text-status-info", icon: <BookOpen className="size-4" /> },
            { label: "Trainer", value: "Proficiency + capacity", tone: "text-status-info", icon: <Award className="size-4" /> },
            { label: "Equipment", value: "Availability + condition", tone: "text-status-info", icon: <Building2 className="size-4" /> },
            { label: "Capacity", value: "Combined delivery", tone: "text-status-positive", icon: <Layers3 className="size-4" /> },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <div className="rounded-md border bg-background p-3 text-center space-y-1">
                <div className="flex justify-center">{s.icon}</div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className={`text-xs font-medium ${s.tone}`}>{s.value}</p>
              </div>
              {i < arr.length - 1 ? <div className="hidden md:flex items-center justify-center"><ArrowRight className="size-4 text-muted-foreground" /></div> : null}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground pt-2 border-t">
          Five dimensions, kept separate. Each is observed independently before being combined into a delivery readiness signal.
        </p>
      </div>

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
              emptyMessage="No institutions match your search."
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
              emptyMessage="No qualifications match your search."
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
