"use client";

import * as React from "react";
import { Building2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useNav } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import type { District, Paginated } from "@/types/domain";

export function DistrictsView() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const openDistrict = useNav((s) => s.openDistrict);
  const path = `/api/v1/districts?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<District>>(path, [search, page]);

  const columns: Column<District>[] = [
    {
      key: "name",
      header: "District",
      cell: (d) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Building2 className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{d.name}</p>
            <p className="text-[11px] text-muted-foreground">{d.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "state",
      header: "State",
      cell: (d) => <span className="text-xs font-mono">{d.stateCode}</span>,
      width: "90px",
    },
    {
      key: "employers",
      header: "Employers",
      cell: (d) => <span className="tabular-nums text-sm">{d._count?.employers ?? 0}</span>,
      width: "110px",
    },
    {
      key: "institutions",
      header: "Institutions",
      cell: (d) => <span className="tabular-nums text-sm">{d._count?.institutions ?? 0}</span>,
      width: "120px",
    },
    {
      key: "location",
      header: "Coordinates",
      cell: (d) => (
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {d.latitude != null && d.longitude != null
            ? `${d.latitude.toFixed(2)}, ${d.longitude.toFixed(2)}`
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: () => <StatusPill tone="positive" dot>Active</StatusPill>,
      width: "120px",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Intelligence"
        description="District-level foundation view of the demonstration training ecosystem. Click a district to open its profile."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search districts by name or code…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(d) => d.id}
            loading={loading && !data}
            onRowClick={(d) => openDistrict(d.id)}
            emptyMessage="No demonstration districts match your search."
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
                <span className="tabular-nums">
                  Page {data.page} / {data.totalPages}
                </span>
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
