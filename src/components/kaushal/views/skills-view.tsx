"use client";

import * as React from "react";
import { Sparkles, Filter } from "lucide-react";
import { PageHeader } from "@/components/kaushal/page-header";
import { DataTable, type Column } from "@/components/kaushal/data-table";
import { StatusPill } from "@/components/kaushal/status-pill";
import { useFetch } from "@/hooks/use-fetch";
import { ErrorState } from "@/components/kaushal/states";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Skill, Paginated } from "@/types/domain";

const CATEGORY_TONE: Record<string, "info" | "positive" | "attention" | "neutral"> = {
  Technical: "info",
  Digital: "positive",
  Safety: "attention",
};

export function SkillsView() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [category, setCategory] = React.useState("ALL");
  const path = `/api/v1/skills?page=${page}&pageSize=20${
    search ? `&search=${encodeURIComponent(search)}` : ""
  }${category !== "ALL" ? `&category=${category}` : ""}`;
  const { data, loading, error, refetch } = useFetch<Paginated<Skill>>(path, [search, page, category]);

  const columns: Column<Skill>[] = [
    {
      key: "name",
      header: "Skill",
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{s.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{s.canonicalName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (s) =>
        s.category ? (
          <StatusPill tone={CATEGORY_TONE[s.category] ?? "neutral"}>{s.category}</StatusPill>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
      width: "130px",
    },
    {
      key: "roles",
      header: "Roles",
      cell: (s) => <span className="tabular-nums text-sm">{s._count?.roleSkills ?? 0}</span>,
      width: "90px",
    },
    {
      key: "courses",
      header: "Courses",
      cell: (s) => <span className="tabular-nums text-sm">{s._count?.courseSkills ?? 0}</span>,
      width: "100px",
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
        title="Skills"
        description="Canonical skill catalogue with categories, role linkages and course coverage."
        badge={<StatusPill tone="info" dot>Live Intelligence</StatusPill>}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Input
          placeholder="Search skills by name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Digital">Digital</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(s) => s.id}
            loading={loading && !data}
            emptyMessage="No demonstration skills match your search."
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
                <span className="tabular-nums">Page {data.page} / {data.totalPages}</span>
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
