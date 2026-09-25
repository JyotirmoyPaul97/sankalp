"use client";

import * as React from "react";
import { Database, Filter } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill, dataStatusTone } from "@/components/kaushal/status-pill";
import { ProvenanceLine } from "@/components/kaushal/source-badge";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState } from "@/components/kaushal/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DataSource, Paginated } from "@/types/domain";

export function DataSourcesView() {
  const [page] = React.useState(1);
  const [status, setStatus] = React.useState("ALL");
  const path = `/api/v1/data-sources?page=${page}&pageSize=50${
    status !== "ALL" ? `&status=${status}` : ""
  }`;
  const { data, loading, error, refetch } = useFetch<Paginated<DataSource>>(path, [page, status]);

  const columns: Column<DataSource>[] = [
    {
      key: "name",
      header: "Data Source",
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Database className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{s.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{s.sourceType}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (s) => (
        <span className="text-xs text-muted-foreground">{s.sourceType.replace(/_/g, " ")}</span>
      ),
      width: "180px",
    },
    {
      key: "status",
      header: "Data Status",
      cell: (s) => (
        <StatusPill tone={dataStatusTone(s.dataStatus)} dot>
          {s.dataStatus}
        </StatusPill>
      ),
      width: "130px",
    },
    {
      key: "updated",
      header: "Last Updated",
      cell: (s) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {s.lastUpdatedAt ? new Date(s.lastUpdatedAt).toLocaleDateString() : "—"}
        </span>
      ),
      width: "140px",
    },
    {
      key: "description",
      header: "Description",
      cell: (s) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-md">
          {s.description ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description="Provenance register for every data stream the platform consumes. Phase 1 ships synthetic demonstration feeds; real government and partner providers are added in later phases."
        badge={<StatusPill tone="info" dot>Phase 1 — Provenance</StatusPill>}
      />

      <EvidencePanel
        title="Provenance Principles"
        source="Governance"
      >
        <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-disc pl-4">
          <li>No labour-market figures are hard-coded in application logic. All values come from registered data sources.</li>
          <li>Every data source declares a <span className="font-mono">data_status</span>: REAL, SYNTHETIC, MODELLED, DEMO, or UNKNOWN.</li>
          <li>Phase 1 sources are all DEMO / SYNTHETIC. The provenance structure is in place so future real feeds require no architecture changes.</li>
          <li>Future providers (OfficialGovernmentProvider, APIProvider, CSVProvider, PartnerProvider) plug into the same abstraction.</li>
        </ul>
      </EvidencePanel>

      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DEMO">DEMO</SelectItem>
            <SelectItem value="SYNTHETIC">SYNTHETIC</SelectItem>
            <SelectItem value="MODELLED">MODELLED</SelectItem>
            <SelectItem value="REAL">REAL</SelectItem>
            <SelectItem value="UNKNOWN">UNKNOWN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(s) => s.id}
          loading={loading && !data}
          emptyMessage="No data sources registered."
        />
      )}

      {data && data.items.length > 0 ? (
        <EvidencePanel title="Registered Provenance Lines" source="Live">
          <div className="space-y-2">
            {data.items.map((s) => (
              <ProvenanceLine
                key={s.id}
                source={s.name}
                status={s.dataStatus}
                lastUpdated={s.lastUpdatedAt}
                href={s.sourceUrl}
              />
            ))}
          </div>
        </EvidencePanel>
      ) : null}
    </div>
  );
}
