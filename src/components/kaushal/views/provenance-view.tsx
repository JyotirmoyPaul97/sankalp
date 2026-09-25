"use client";

import * as React from "react";
import { FileSearch, GitBranch, FileText } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { StatusPill, dataStatusTone } from "@/components/kaushal/status-pill";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import type { IngestionBatch, Paginated } from "@/types/domain";

/**
 * Provenance view — shows the Source → Batch → Record chain.
 * Select a batch to drill into its ingested records' raw provenance.
 */
export function ProvenanceView() {
  const { data: batchesData, loading: batchesLoading } = useFetch<Paginated<IngestionBatch>>("/api/v1/ingestion/batches?pageSize=10");
  const [selectedBatchCode, setSelectedBatchCode] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provenance"
        description="Trace every record back to its source, ingestion batch, and raw origin. Source → Batch → Record chain."
        badge={<StatusPill tone="info" dot>Phase 2 — Traceability</StatusPill>}
      />

      <EvidencePanel title="Provenance Model" source="Governance">
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          {[
            { icon: <FileText className="size-5" />, t: "Source", d: "Registered data feed with status + provider." },
            { icon: <GitBranch className="size-5" />, t: "Batch", d: "One ingestion operation — file + counts + quality." },
            { icon: <FileSearch className="size-5" />, t: "Record", d: "Raw source record preserved + normalized link." },
          ].map((s, i) => (
            <React.Fragment key={s.t}>
              <div className="flex-1 rounded-md border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary">{s.icon}<span className="text-sm font-medium">{s.t}</span></div>
                <p className="text-xs text-muted-foreground">{s.d}</p>
              </div>
              {i < 2 ? <div className="hidden md:flex items-center text-muted-foreground">→</div> : null}
            </React.Fragment>
          ))}
        </div>
      </EvidencePanel>

      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="Recent Batches" source="Ingestion">
          {batchesLoading ? <LoadingState label="Loading batches…" /> : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto scroll-thin">
              {(batchesData?.items ?? []).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatchCode(b.batchCode)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${selectedBatchCode === b.batchCode ? "border-primary bg-primary/5" : "hover:bg-accent/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-medium">{b.batchCode}</span>
                    <StatusPill tone={dataStatusTone(b.dataSource?.dataStatus ?? "UNKNOWN")} dot>{b.dataSource?.dataStatus ?? "—"}</StatusPill>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{b.dataSource?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.recordsAccepted} records · {b.fileName ?? "synthetic"}</p>
                </button>
              ))}
            </div>
          )}
        </EvidencePanel>

        <EvidencePanel title="Batch Provenance Detail" source="Live">
          {!selectedBatchCode ? (
            <div className="text-sm text-muted-foreground text-center py-8">Select a batch to view its provenance chain.</div>
          ) : (
            <ProvenanceDetail batchCode={selectedBatchCode} />
          )}
        </EvidencePanel>
      </div>
    </div>
  );
}

function ProvenanceDetail({ batchCode }: { batchCode: string }) {
  const { data, loading, error } = useFetch<{ batch: IngestionBatch; sampleRecords: { id: string; sourceRecordId: string | null; entityType: string; normalizedId: string | null; qualityStatus: string; dataStatus: string; rawJson: string }[]; recordCount: number; errorCount: number }>(
    `/api/v1/ingestion/batches/${batchCode}`,
    [batchCode],
  );

  if (loading) return <LoadingState label="Loading provenance…" />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return null;

  const cols: Column<typeof data.sampleRecords[number]>[] = [
    { key: "src", header: "Source Record", cell: (r) => <span className="font-mono text-[11px]">{r.sourceRecordId ?? "—"}</span>, width: "120px" },
    { key: "entity", header: "Entity", cell: (r) => <span className="text-xs">{r.entityType}</span>, width: "120px" },
    { key: "status", header: "Status", cell: (r) => <StatusPill tone={dataStatusTone(r.dataStatus)} dot>{r.dataStatus}</StatusPill>, width: "110px" },
    { key: "q", header: "Quality", cell: (r) => <StatusPill tone={r.qualityStatus === "ACCEPTED" ? "positive" : "attention"} dot>{r.qualityStatus}</StatusPill>, width: "140px" },
    { key: "norm", header: "Normalized ID", cell: (r) => <span className="font-mono text-[10px] text-muted-foreground">{r.normalizedId?.slice(0, 18)}…</span> },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border p-2"><p className="text-muted-foreground">Batch</p><p className="font-mono">{data.batch.batchCode}</p></div>
        <div className="rounded border p-2"><p className="text-muted-foreground">Source</p><p>{data.batch.dataSource?.name ?? "—"}</p></div>
        <div className="rounded border p-2"><p className="text-muted-foreground">Records</p><p className="tabular-nums">{data.recordCount}</p></div>
        <div className="rounded border p-2"><p className="text-muted-foreground">Errors</p><p className="tabular-nums">{data.errorCount}</p></div>
      </div>
      <DataTable columns={cols} rows={data.sampleRecords} rowKey={(r) => r.id} emptyMessage="No provenance records." />
    </div>
  );
}
