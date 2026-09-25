"use client";

import * as React from "react";
import { ArrowRight, History } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill, dataStatusTone } from "@/components/kaushal/status-pill";
import { ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/store/app-store";
import type { IngestionBatch, Paginated } from "@/types/domain";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

function batchStatusTone(s: string): "positive" | "attention" | "critical" | "neutral" {
  switch (s) {
    case "COMPLETED": return "positive";
    case "COMPLETED_WITH_WARNINGS": return "attention";
    case "FAILED": return "critical";
    case "PROCESSING":
    case "VALIDATING":
    case "UPLOADED": return "info" as never;
    default: return "neutral";
  }
}

export function ImportBatchesView() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("ALL");
  const openDistrict = useNav((s) => s.openDistrict);
  void openDistrict;
  const setActiveView = useNav((s) => s.setActiveView);
  const path = `/api/v1/ingestion/batches?page=${page}&pageSize=15${search ? `&search=${encodeURIComponent(search)}` : ""}${status !== "ALL" ? `&status=${status}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<IngestionBatch>>(path, [search, page, status]);

  const cols: Column<IngestionBatch>[] = [
    { key: "batch", header: "Batch", cell: (b) => (
      <div className="flex items-center gap-2">
        <History className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium font-mono">{b.batchCode}</p>
          <p className="text-[11px] text-muted-foreground">{b.fileName ?? "synthetic"}</p>
        </div>
      </div>
    )},
    { key: "source", header: "Source", cell: (b) => (
      <div>
        <p className="text-sm">{b.dataSource?.name ?? "—"}</p>
        {b.dataSource ? <StatusPill tone={dataStatusTone(b.dataSource.dataStatus)} dot>{b.dataSource.dataStatus}</StatusPill> : null}
      </div>
    )},
    { key: "received", header: "Received", cell: (b) => <span className="tabular-nums text-sm">{b.recordsReceived}</span>, width: "90px" },
    { key: "accepted", header: "Accepted", cell: (b) => <span className="tabular-nums text-sm text-status-positive">{b.recordsAccepted}</span>, width: "90px" },
    { key: "rejected", header: "Rejected", cell: (b) => <span className="tabular-nums text-sm">{b.recordsRejected}</span>, width: "90px" },
    { key: "dup", header: "Duplicates", cell: (b) => <span className="tabular-nums text-sm text-status-attention">{b.recordsDuplicate}</span>, width: "100px" },
    { key: "quality", header: "Quality", cell: (b) => b.qualityScore != null ? (
      <StatusPill tone={b.qualityScore >= 85 ? "positive" : b.qualityScore >= 60 ? "attention" : "critical"} dot>{b.qualityScore}</StatusPill>
    ) : <span className="text-xs text-muted-foreground">—</span>, width: "90px" },
    { key: "status", header: "Status", cell: (b) => <StatusPill tone={batchStatusTone(b.status)} dot>{b.status.replace(/_/g, " ")}</StatusPill>, width: "170px" },
    { key: "started", header: "Started", cell: (b) => <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(b.createdAt).toLocaleString()}</span>, width: "160px" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Batches"
        description="History of every ingestion operation with summary counts, quality score, and provenance."
        badge={<StatusPill tone="info" dot>Phase 2 — Audit</StatusPill>}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Input placeholder="Search by batch code or filename…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="COMPLETED_WITH_WARNINGS">Completed with warnings</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : (
        <>
          <DataTable
            columns={cols}
            rows={data?.items ?? []}
            rowKey={(b) => b.id}
            loading={loading && !data}
            onRowClick={(b) => setActiveView("batch-detail:" + b.id)}
            emptyMessage="No ingestion batches yet. Upload a dataset to create one."
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

/** Batch detail sub-view (rendered when activeView === "batch-detail:<id>"). */
export function BatchDetailView() {
  const activeView = useNav((s) => s.activeView);
  const setActiveView = useNav((s) => s.setActiveView);
  const batchId = activeView.startsWith("batch-detail:") ? activeView.split(":")[1] : null;
  const { data, loading, error, refetch } = useFetch(`/api/v1/ingestion/batches/${batchId}`, [batchId]);

  if (loading && !data) return <div className="text-sm text-muted-foreground">Loading batch…</div>;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return <ErrorState title="Batch not found" />;

  const b = data.batch;
  const errorCols: Column<typeof data.errors[number]>[] = [
    { key: "row", header: "Row", cell: (e) => <span className="tabular-nums text-xs font-mono">{e.rowNumber}</span>, width: "70px" },
    { key: "severity", header: "Severity", cell: (e) => <StatusPill tone={e.severity === "ERROR" ? "critical" : e.severity === "WARNING" ? "attention" : "neutral"} dot>{e.severity}</StatusPill>, width: "110px" },
    { key: "field", header: "Field", cell: (e) => <span className="text-xs font-mono">{e.field ?? "—"}</span>, width: "140px" },
    { key: "problem", header: "Problem", cell: (e) => <span className="text-xs">{e.problem}</span> },
    { key: "action", header: "Suggested Action", cell: (e) => <span className="text-xs text-muted-foreground">{e.suggestedAction ?? "—"}</span>, width: "240px" },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => setActiveView("import-batches")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowRight className="size-4 rotate-180" /> Back to batches
      </button>

      <PageHeader
        title={b.batchCode}
        description={`${b.dataSource.name} · ${b.fileType.toUpperCase()} · ${b.importMode} mode`}
        badge={<StatusPill tone={batchStatusTone(b.status)} dot>{b.status.replace(/_/g, " ")}</StatusPill>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-md border p-3 space-y-1"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Received</p><p className="text-2xl font-semibold tabular-nums">{b.recordsReceived}</p></div>
        <div className="rounded-md border p-3 space-y-1"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Accepted</p><p className="text-2xl font-semibold tabular-nums text-status-positive">{b.recordsAccepted}</p></div>
        <div className="rounded-md border p-3 space-y-1"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Rejected</p><p className="text-2xl font-semibold tabular-nums text-status-critical">{b.recordsRejected}</p></div>
        <div className="rounded-md border p-3 space-y-1"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Duplicates</p><p className="text-2xl font-semibold tabular-nums text-status-attention">{b.recordsDuplicate}</p></div>
        <div className="rounded-md border p-3 space-y-1"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Quality</p><p className="text-2xl font-semibold tabular-nums">{b.qualityScore ?? "—"}</p></div>
      </div>

      {b.uploadedFile ? (
        <div className="rounded-md border bg-muted/30 p-4 text-xs space-y-1">
          <p><span className="text-muted-foreground">File:</span> {b.uploadedFile.fileName}</p>
          <p><span className="text-muted-foreground">Checksum:</span> <span className="font-mono">{b.uploadedFile.checksum.slice(0, 24)}…</span></p>
          <p><span className="text-muted-foreground">Started:</span> {new Date(b.startedAt).toLocaleString()}</p>
          {b.completedAt ? <p><span className="text-muted-foreground">Completed:</span> {new Date(b.completedAt).toLocaleString()}</p> : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Validation Issues ({data.errorCount})</h3>
        <DataTable columns={errorCols} rows={data.errors} rowKey={(e) => e.id} emptyMessage="No validation issues — all records passed." />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Provenance Sample ({data.recordCount} records)</h3>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">source_record_id</th><th className="text-left p-2 font-medium">entity</th><th className="text-left p-2 font-medium">normalized_id</th><th className="text-left p-2 font-medium">status</th></tr></thead>
              <tbody>
                {data.sampleRecords.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 font-mono">{r.sourceRecordId ?? "—"}</td>
                    <td className="p-2">{r.entityType}</td>
                    <td className="p-2 font-mono text-muted-foreground">{r.normalizedId?.slice(0, 16)}…</td>
                    <td className="p-2"><StatusPill tone={r.qualityStatus === "ACCEPTED" ? "positive" : r.qualityStatus === "DUPLICATE" ? "attention" : "neutral"} dot>{r.qualityStatus}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
