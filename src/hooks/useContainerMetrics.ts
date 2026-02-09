"use client";

import { fetchMetric } from "@/actions/metrics";
import { useEffect, useState } from "react";
import { buildContainerRegex, resolvePrometheusUrl } from "@/lib/prometheus";

export interface ContainerResourceMetrics {
  cpuPercent: number | null;
  memoryUsedBytes: number | null;
  memoryLimitBytes: number | null;
  memoryPercent: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
}

export function useContainerMetrics(containerName?: string, prometheusUrl?: string, intervalMs = 10000) {
  const [data, setData] = useState<ContainerResourceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerName) {
      setData(null);
      setLoading(false);
      setError("Container name is missing");
      return;
    }

    let cancelled = false;
    const url = resolvePrometheusUrl(prometheusUrl);
    const matcher = buildContainerRegex(containerName);

    const cpuQuery = `sum(rate(container_cpu_usage_seconds_total{name=~"${matcher}"}[1m])) * 100`;
    const memoryUsedQuery = `sum(container_memory_usage_bytes{name=~"${matcher}"})`;
    const memoryLimitQuery = `sum(container_spec_memory_limit_bytes{name=~"${matcher}"})`;
    const networkRxQuery = `sum(rate(container_network_receive_bytes_total{name=~"${matcher}"}[1m]))`;
    const networkTxQuery = `sum(rate(container_network_transmit_bytes_total{name=~"${matcher}"}[1m]))`;

    const loadData = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        const [cpu, memoryUsed, memoryLimit, networkRx, networkTx] = await Promise.all([
          fetchMetric(url, cpuQuery),
          fetchMetric(url, memoryUsedQuery),
          fetchMetric(url, memoryLimitQuery),
          fetchMetric(url, networkRxQuery),
          fetchMetric(url, networkTxQuery),
        ]);

        const firstError = [cpu, memoryUsed, memoryLimit, networkRx, networkTx].find((metric) => metric.status === "error");
        if (firstError?.status === "error") {
          throw new Error(firstError.error || "Failed to load container metrics");
        }

        const memoryLimitValue = Number.isFinite(memoryLimit.currentValue) ? memoryLimit.currentValue : 0;
        const memoryUsedValue = Number.isFinite(memoryUsed.currentValue) ? memoryUsed.currentValue : 0;
        const memoryPercent = memoryLimitValue > 0 ? (memoryUsedValue / memoryLimitValue) * 100 : null;

        if (!cancelled) {
          setData({
            cpuPercent: Number.isFinite(cpu.currentValue) ? cpu.currentValue : null,
            memoryUsedBytes: Number.isFinite(memoryUsedValue) ? memoryUsedValue : null,
            memoryLimitBytes: memoryLimitValue > 0 ? memoryLimitValue : null,
            memoryPercent,
            networkRxBps: Number.isFinite(networkRx.currentValue) ? networkRx.currentValue : null,
            networkTxBps: Number.isFinite(networkTx.currentValue) ? networkTx.currentValue : null,
          });
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch container metrics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    const timer = setInterval(loadData, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [containerName, prometheusUrl, intervalMs]);

  return { data, loading, error };
}
