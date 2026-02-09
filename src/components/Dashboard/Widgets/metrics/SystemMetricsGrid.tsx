"use client";

import { useHostMetrics } from "@/hooks/useHostMetrics";
import { HostResourceCards } from "./HostResourceCards";

export function SystemMetricsGrid() {
  const { data, loading, error } = useHostMetrics();

  return <HostResourceCards data={data} loading={loading} error={error} />;
}
