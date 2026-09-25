"use client";

import * as React from "react";
import { GaugeCircle } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { StatusPill } from "@/components/kaushal/status-pill";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/store/app-store";
import type { IngestionBatch, Paginated } from "@/types/domain";

interface QualityReport {
  batchId: string;
  batchCode: string;
  status: string;
  counts: { received: number; accepted: number; rejected: number; duplicate: number; warning: number };
  qualityScore: { total: number; completeness: number; validity: number; uniqueness: number; consistency: number; overall: number };
  storedQualityScore: number | null;
  topFields: { field: string; count: number; severity: string }[];
  totalErrors: number;
  errorsBySeverity: { ERROR: number; WARNING: number; INFO: number };
}

export function DataQualityView() {
  const [selectedBatchId, setSelectedBatchId] = React.useState<string | null>(null);
  const { data: batchesData, loading: batchesLoading } = useFetch<Paginated<IngestionBatch>>("/api/v1/ingestion/batches?pageSize=50");
  const { data: report, loading: reportLoading, error } = useFetch<QualityReport>(
    selectedBatchId ? `/api/v1/data-quality/${selectedBatchId}` : null,
    [selectedBatchId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality"
        description="Per-batch quality dashboard: completeness, validity, uniqueness, consistency. Deterministic — no ML."
        badge={<StatusPill tone="info" dot>Phase 2 — Quality</StatusPill>}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Batch list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Batches</h3>
          {batchesLoading ? <LoadingState label="Loading batches…" /> : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto scroll-thin pr-1">
              {(batchesData?.items ?? []).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${selectedBatchId === b.id ? "border-primary bg-primary/5" : "hover:bg-accent/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-medium truncate">{b.batchCode}</span>
                    {b.qualityScore != null ? (
                      <StatusPill tone={b.qualityScore >= 85 ? "positive" : b.qualityScore >= 60 ? "attention" : "critical"} dot>{b.qualityScore}</StatusPill>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{b.dataSource?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.recordsAccepted} accepted · {b.recordsRejected} rejected</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Report */}
        <div className="lg:col-span-2 space-y-5">
          {!selectedBatchId ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-12 text-center text-sm text-muted-foreground">
              Select a batch on the left to view its quality report.
            </div>
          ) : reportLoading ? (
            <LoadingState label="Loading quality report…" />
          ) : error ? (
            <ErrorState message={error.message} />
          ) : report ? (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-1">{report.batchCode}</h3>
                <p className="text-xs text-muted-foreground">Status: {report.status.replace(/_/g, " ")}</p>
              </div>

              {/* Overall score */}
              <div className="rounded-lg border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GaugeCircle className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Data Quality Score</span>
                  </div>
                  <StatusPill tone={report.qualityScore.overall >= 85 ? "positive" : report.qualityScore.overall >= 60 ? "attention" : "critical"} dot>
                    {report.qualityScore.overall} / 100
                  </StatusPill>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { k: "Completeness", v: report.qualityScore.completeness, w: "35%" },
                    { k: "Validity", v: report.qualityScore.validity, w: "30%" },
                    { k: "Uniqueness", v: report.qualityScore.uniqueness, w: "20%" },
                    { k: "Consistency", v: report.qualityScore.consistency, w: "15%" },
                  ].map((d) => (
                    <div key={d.k} className="space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{d.k}</span><span className="tabular-nums">{d.v}%</span></div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${d.v}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">weight {d.w}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Score = 0.35·completeness + 0.30·validity + 0.20·uniqueness + 0.15·consistency. Label: <span className="font-medium">Data Quality Score</span> (not a labour-market score).
                </p>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-5 gap-2">
                {[
                  { k: "Received", v: report.counts.received, tone: "default" as const },
                  { k: "Accepted", v: report.counts.accepted, tone: "positive" as const },
                  { k: "Rejected", v: report.counts.rejected, tone: "critical" as const },
                  { k: "Duplicates", v: report.counts.duplicate, tone: "attention" as const },
                  { k: "Warnings", v: report.counts.warning, tone: "attention" as const },
                ].map((m) => (
                  <div key={m.k} className="rounded-md border p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.k}</p>
                    <p className="text-xl font-semibold tabular-nums">{m.v}</p>
                  </div>
                ))}
              </div>

              {/* Errors by severity */}
              <div className="rounded-md border p-4 space-y-2">
                <h4 className="text-sm font-medium">Errors by Severity</h4>
                <div className="flex gap-3 text-xs">
                  <StatusPill tone="critical" dot>ERROR {report.errorsBySeverity.ERROR}</StatusPill>
                  <StatusPill tone="attention" dot>WARNING {report.errorsBySeverity.WARNING}</StatusPill>
                  <StatusPill tone="neutral" dot>INFO {report.errorsBySeverity.INFO}</StatusPill>
                </div>
              </div>

              {/* Top problem fields */}
              {report.topFields.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Top Problem Fields</h4>
                  <DataTable
                    columns={[
                      { key: "field", header: "Field", cell: (f) => <span className="font-mono text-xs">{f.field}</span> },
                      { key: "count", header: "Occurrences", cell: (f) => <span className="tabular-nums text-sm">{f.count}</span>, width: "120px" },
                      { key: "severity", header: "Severity", cell: (f) => <StatusPill tone={f.severity === "ERROR" ? "critical" : "attention"} dot>{f.severity}</StatusPill>, width: "110px" },
                    ]}
                    rows={report.topFields}
                    rowKey={(f) => f.field}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
