"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Building2, Factory, GraduationCap, MapPin } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { MetricCard } from "@/components/kaushal/metric-card";
import { EvidencePanel } from "@/components/kaushal/evidence-panel";
import { StatusPill } from "@/components/kaushal/status-pill";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState, LoadingState } from "@/components/kaushal/states";
import { useNav } from "@/store/app-store";
import type { DistrictDetail, Employer, Institution } from "@/types/domain";

export function DistrictProfileView() {
  const districtId = useNav((s) => s.activeDistrictId);
  const setActiveView = useNav((s) => s.setActiveView);
  const { data: district, loading, error, refetch } = useFetch<DistrictDetail>(
    districtId ? `/api/v1/districts/${districtId}` : null,
  );

  if (loading && !district) return <LoadingState label="Loading district profile…" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!district)
    return (
      <ErrorState
        title="District not selected"
        message="No district was selected. Return to the district list to choose one."
        onRetry={() => setActiveView("districts")}
      />
    );

  const employerCols: Column<Employer>[] = [
    { key: "name", header: "Employer", cell: (e) => <span className="text-sm font-medium">{e.name}</span> },
    {
      key: "sector",
      header: "Sector",
      cell: (e) => <span className="text-xs text-muted-foreground">{e.industrySector?.name ?? "—"}</span>,
    },
    {
      key: "size",
      header: "Size",
      cell: (e) => <span className="text-xs font-mono">{e.sizeCategory}</span>,
      width: "110px",
    },
    {
      key: "verified",
      header: "Verified",
      cell: (e) =>
        e.isVerified ? (
          <StatusPill tone="positive" dot>Verified</StatusPill>
        ) : (
          <StatusPill tone="neutral" dot>Pending</StatusPill>
        ),
      width: "120px",
    },
  ];

  const institutionCols: Column<Institution>[] = [
    {
      key: "name",
      header: "Institution",
      cell: (i) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{i.name}</span>
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
      key: "active",
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

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveView("districts")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to districts
      </button>

      <PageHeader
        title={district.name}
        description={`District code ${district.code} · State ${district.stateCode}. Synthetic demonstration profile.`}
        badge={<StatusPill tone="info" dot>Foundation Profile</StatusPill>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Employers"
          value={district.employers.length}
          hint="Demonstration employers"
          icon={<Factory className="size-4" />}
          tone="info"
        />
        <MetricCard
          label="Institutions"
          value={district.institutions.length}
          hint="Training institutions"
          icon={<GraduationCap className="size-4" />}
          tone="default"
        />
        <MetricCard
          label="State Code"
          value={district.stateCode}
          hint="ISO state code"
          icon={<Building2 className="size-4" />}
          tone="default"
        />
        <MetricCard
          label="Coordinates"
          value={
            district.latitude != null && district.longitude != null
              ? `${district.latitude.toFixed(2)}°`
              : "—"
          }
          hint={district.longitude != null ? `${district.longitude.toFixed(2)}° lon` : ""}
          icon={<MapPin className="size-4" />}
          tone="default"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <EvidencePanel title="Employers in District" source="Synthetic" confidence="low">
          <DataTable
            columns={employerCols}
            rows={district.employers}
            rowKey={(e) => e.id}
            emptyMessage="No demonstration employers in this district."
          />
        </EvidencePanel>

        <EvidencePanel title="Training Institutions" source="Synthetic" confidence="low">
          <DataTable
            columns={institutionCols}
            rows={district.institutions}
            rowKey={(i) => i.id}
            emptyMessage="No demonstration institutions in this district."
          />
        </EvidencePanel>
      </div>

      <EvidencePanel title="Labour-Market Intelligence" source="District Twin" confidence="high">
        <div className="space-y-2 text-sm">
          <p className="text-xs text-muted-foreground">Demand signals and skill-gap intelligence are available in the District Digital Twin and Gap Intelligence views.</p>
          <div className="flex items-center gap-2 pt-2">
            <button onClick={() => useNav.getState().setActiveView("district-twin")} className="text-xs text-primary hover:underline flex items-center gap-1">
              Open District Digital Twin <ArrowRight className="size-3" />
            </button>
            <button onClick={() => useNav.getState().setActiveView("gap-districts")} className="text-xs text-primary hover:underline flex items-center gap-1 ml-3">
              View District Gaps <ArrowRight className="size-3" />
            </button>
          </div>
        </div>
      </EvidencePanel>
    </div>
  );
}
