"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useNav } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { District, DistrictGapSummary, Paginated } from "@/types/domain";

function intensityFor(d: DistrictGapSummary | undefined): number {
  if (!d || d.totalGaps === 0) return 0;
  const moderate = Math.max(0, d.totalGaps - d.highGapCount - d.coveredCount - d.noSupplyCount - d.proficiencyMismatchCount - d.geographicGapCount);
  const composite =
    d.highGapCount * 1 + d.noSupplyCount * 0.8 + d.proficiencyMismatchCount * 0.5 + moderate * 0.4;
  return Math.min(1, composite / Math.max(1, d.totalGaps));
}

function intensityTone(i: number): "positive" | "info" | "attention" | "critical" {
  if (i === 0) return "positive";
  if (i < 0.25) return "info";
  if (i < 0.55) return "attention";
  return "critical";
}

function GapIntensityBar({ d }: { d: DistrictGapSummary | undefined }) {
  if (!d) {
    return <span className="text-[11px] text-muted-foreground">—</span>;
  }
  const i = intensityFor(d);
  const tone = intensityTone(i);
  const toneClass = {
    positive: "bg-status-positive",
    info: "bg-status-info",
    attention: "bg-status-attention",
    critical: "bg-status-critical",
  }[tone];

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${toneClass}`}
                style={{ width: `${Math.max(4, Math.round(i * 100))}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {d.highGapCount}/{d.totalGaps}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-0.5">
            <p className="font-medium">{d.district.name} gap intensity</p>
            <p className="text-muted-foreground">
              High gaps: <span className="tabular-nums text-foreground">{d.highGapCount}</span>
            </p>
            <p className="text-muted-foreground">
              No-supply skills: <span className="tabular-nums text-foreground">{d.noSupplyCount}</span>
            </p>
            <p className="text-muted-foreground">
              Covered: <span className="tabular-nums text-foreground">{d.coveredCount}</span>
            </p>
            <p className="text-muted-foreground">
              Total signals: <span className="tabular-nums text-foreground">{d.totalGaps}</span>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DistrictsView() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const openDistrict = useNav((s) => s.openDistrict);
  const path = `/api/v1/districts?page=${page}&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<District>>(path, [search, page]);
  const { data: gapData } = useFetch<{ districts: DistrictGapSummary[] }>("/api/v1/gaps/districts");

  const gapByDistrict = React.useMemo(() => {
    const map = new Map<string, DistrictGapSummary>();
    for (const d of gapData?.districts ?? []) map.set(d.district.id, d);
    return map;
  }, [gapData]);

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
      key: "gapIntensity",
      header: "Gap Intensity",
      cell: (d) => <GapIntensityBar d={gapByDistrict.get(d.id)} />,
      width: "180px",
    },
    {
      key: "highGaps",
      header: "High Gaps",
      cell: (d) => {
        const g = gapByDistrict.get(d.id);
        const v = g?.highGapCount ?? 0;
        return (
          <span
            className={
              "tabular-nums text-sm font-medium " +
              (v > 5 ? "text-status-critical" : v > 0 ? "text-status-attention" : "text-status-positive")
            }
          >
            {v}
          </span>
        );
      },
      width: "100px",
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
      key: "status",
      header: "Status",
      cell: () => <StatusPill tone="positive" dot>Monitored</StatusPill>,
      width: "120px",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Intelligence"
        description="Live intelligence across Maharashtra districts — skill-gap intensity, employers, training institutions. Click a district to open its skill profile."
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
            emptyMessage="No districts match your search."
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
