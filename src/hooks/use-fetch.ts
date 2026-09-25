"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api-client";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

/**
 * Lightweight Phase-1 fetch hook. Avoids pulling a full React Query
 * setup for the foundation shell; can be swapped for TanStack Query
 * in a later phase without changing call sites much.
 */
export function useFetch<T>(path: string | null, deps: unknown[] = []): UseFetchState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(!!path);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<T>(path)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: ApiError) => {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, tick, ...deps]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}
