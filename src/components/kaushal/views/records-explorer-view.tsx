"use client";

import * as React from "react";
import { TableProperties } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill, dataStatusTone } from "@/components/kaushal/status-pill";
import { ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Paginated } from "@/types/domain";

const ENTITIES = [
  { id: "job_posting", label: "Job Postings", searchFields: ["employerName", "roleTitle", "districtName"] },
  { id: "employer_survey", label: "Employer Surveys", searchFields: ["employerName", "roleTitle"] },
  { id: "industry_consultation", label: "Industry Consultations", searchFields: ["organization", "sectorName"] },
  { id: "sector_growth", label: "Sector Growth", searchFields: ["sectorName", "geography", "period"] },
  { id: "placement_outcome", label: "Placement Outcomes", searchFields: ["courseName", "institutionName", "period"] },
  { id: "technology_trend", label: "Technology Trends", searchFields: ["technology", "sectorName"] },
];

export function RecordsExplorerView() {
  const [entity, setEntity] = React.useState("job_posting");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("ALL");

  const path = `/api/v1/records/${entity}?page=${page}&pageSize=15${search ? `&search=${encodeURIComponent(search)}` : ""}${status !== "ALL" ? `&dataStatus=${status}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<Record<string, unknown>>>(path, [entity, search, page, status]);

  const cols: Column<Record<string, unknown>>[] = React.useMemo(() => {
    const cfg = ENTITIES.find((e) => e.id === entity)!;
    const base: Column<Record<string, unknown>>[] = [
      { key: "sourceRecordId", header: "Source ID", cell: (r) => <span className="font-mono text-[11px]">{(r.sourceRecordId as string) ?? "—"}</span>, width: "120px" },
      { key: "dataStatus", header: "Status", cell: (r) => <StatusPill tone={dataStatusTone((r.dataStatus as string) ?? "UNKNOWN")} dot>{(r.dataStatus as string) ?? "—"}</StatusPill>, width: "110px" },
      ...cfg.searchFields.map<Column<Record<string, unknown>>>((f) => ({
        key: f,
        header: f.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        cell: (r) => <span className="text-sm">{(r[f] as string) ?? "—"}</span>,
      })),
      { key: "ingestedAt", header: "Ingested", cell: (r) => <span className="text-[11px] text-muted-foreground tabular-nums">{r.ingestedAt ? new Date(r.ingestedAt as string).toLocaleDateString() : "—"}</span>, width: "120px" },
    ];
    return base;
  }, [entity]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Records Explorer"
        description="Searchable, filterable view across every ingested evidence table. Each row carries full provenance."
        badge={<StatusPill tone="info" dot>Phase 2 — Explorer</StatusPill>}
      />

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <Select value={entity} onValueChange={(v) => { setEntity(v); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENTITIES.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder={`Search ${ENTITIES.find((e) => e.id === entity)?.label ?? ""}…`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="REAL">REAL</SelectItem>
            <SelectItem value="SYNTHETIC">SYNTHETIC</SelectItem>
            <SelectItem value="MODELLED">MODELLED</SelectItem>
            <SelectItem value="DEMO">DEMO</SelectItem>
            <SelectItem value="UNKNOWN">UNKNOWN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : (
        <>
          <DataTable
            columns={cols}
            rows={data?.items ?? []}
            rowKey={(r) => (r.id as string) ?? JSON.stringify(r).slice(0, 32)}
            loading={loading && !data}
            emptyMessage="No records match your search."
          />
          {data ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}</span>
              <div className="flex items-center gap-2">
                <button disabled={data.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent">Previous</button>
                <span className="tabular-nums">Page {data.page} / {data.totalPages}</span>
                <button disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-accent">Next</button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
