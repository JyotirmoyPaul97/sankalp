"use client";

import * as React from "react";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { StatusPill } from "@/components/kaushal/status-pill";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { ErrorState } from "@/components/kaushal/states";
import { useFetch } from "@/hooks/use-fetch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AuditLog, Paginated } from "@/types/domain";

const ACTION_TONE: Record<string, "positive" | "info" | "attention" | "neutral"> = {
  UPLOADED_DATASET: "info",
  VALIDATED_DATASET: "info",
  CONFIRMED_IMPORT: "positive",
  CREATED_SOURCE: "positive",
  UPDATED_SOURCE: "attention",
  DELETED_SOURCE: "attention",
  LOGIN: "neutral",
  LOGOUT: "neutral",
};

export function AuditLogsView() {
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState("ALL");
  const path = `/api/v1/audit-logs?page=${page}&pageSize=25${action !== "ALL" ? `&action=${action}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<AuditLog>>(path, [page, action]);

  const cols: Column<AuditLog>[] = [
    { key: "time", header: "Timestamp", cell: (l) => <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(l.timestamp).toLocaleString()}</span>, width: "180px" },
    { key: "user", header: "User", cell: (l) => (
      <div>
        <p className="text-sm">{l.userEmail ?? "system"}</p>
        {l.userId ? <p className="text-[10px] text-muted-foreground font-mono">{l.userId.slice(0, 12)}…</p> : null}
      </div>
    )},
    { key: "action", header: "Action", cell: (l) => <StatusPill tone={ACTION_TONE[l.action] ?? "neutral"} dot>{l.action}</StatusPill>, width: "180px" },
    { key: "resource", header: "Resource", cell: (l) => <span className="text-xs font-mono">{l.resource ?? "—"}</span> },
    { key: "status", header: "Status", cell: (l) => <StatusPill tone={l.status === "SUCCESS" ? "positive" : "critical"} dot>{l.status}</StatusPill>, width: "100px" },
    { key: "details", header: "Details", cell: (l) => (
      <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-md font-mono">{l.details ?? "—"}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Ingestion + admin action trail. No passwords, tokens, or secrets are ever logged."
        badge={<StatusPill tone="info" dot>Phase 2 — Audit</StatusPill>}
      />

      <div className="flex items-center gap-2">
        <ScrollText className="size-4 text-muted-foreground" />
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            <SelectItem value="UPLOADED_DATASET">Uploaded dataset</SelectItem>
            <SelectItem value="VALIDATED_DATASET">Validated dataset</SelectItem>
            <SelectItem value="CONFIRMED_IMPORT">Confirmed import</SelectItem>
            <SelectItem value="CREATED_SOURCE">Created source</SelectItem>
            <SelectItem value="UPDATED_SOURCE">Updated source</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="LOGOUT">Logout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : (
        <>
          <DataTable
            columns={cols}
            rows={data?.items ?? []}
            rowKey={(l) => l.id}
            loading={loading && !data}
            emptyMessage="No audit events yet."
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
