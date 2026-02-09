"use client";

import { fetchMetric } from "@/actions/metrics";
import { useEffect, useState } from "react";
import { resolvePrometheusUrl } from "@/lib/prometheus";
import { usePrometheusHost } from "@/hooks/usePrometheusHost";

export interface HostMetricsData {
  cpuPercent: number | null;
  memoryUsedBytes: number | null;
  memoryTotalBytes: number | null;
  memoryPercent: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
}

export function useHostMetrics(intervalMs = 10000) {
  const [data, setData] = useState<HostMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { host: metricsHost, loading: hostLoading, error: hostError } = usePrometheusHost();

  useEffect(() => {
    let cancelled = false;

    const prometheusUrl = resolvePrometheusUrl(metricsHost);
    if (!prometheusUrl) {
      setData(null);
      setLoading(hostLoading);
      setError(hostError || "Prometheus host is not configured in /system/metrics.");
      return;
    }

    const cpuQuery = '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)';
    const memoryUsedQuery = "node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes";
    const memoryTotalQuery = "node_memory_MemTotal_bytes";
    const networkRxQuery = 'sum(rate(node_network_receive_bytes_total{device!~"lo"}[1m]))';
    const networkTxQuery = 'sum(rate(node_network_transmit_bytes_total{device!~"lo"}[1m]))';

    const loadData = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        const [cpu, memoryUsed, memoryTotal, networkRx, networkTx] = await Promise.all([
          fetchMetric(prometheusUrl, cpuQuery),
          fetchMetric(prometheusUrl, memoryUsedQuery),
          fetchMetric(prometheusUrl, memoryTotalQuery),
          fetchMetric(prometheusUrl, networkRxQuery),
          fetchMetric(prometheusUrl, networkTxQuery),
        ]);

        const firstError = [cpu, memoryUsed, memoryTotal, networkRx, networkTx].find((metric) => metric.status === "error");
        if (firstError?.status === "error") {
          throw new Error(firstError.error || "Failed to load host metrics");
        }

        const cpuPercent = cpu.hasSample ? cpu.currentValue : null;
        const memoryUsedBytes = memoryUsed.hasSample ? memoryUsed.currentValue : null;
        const memoryTotalBytes = memoryTotal.hasSample ? memoryTotal.currentValue : null;
        const networkRxBps = networkRx.hasSample ? networkRx.currentValue : null;
        const networkTxBps = networkTx.hasSample ? networkTx.currentValue : null;
        const memoryPercent =
          memoryUsedBytes !== null && memoryTotalBytes !== null && memoryTotalBytes > 0
            ? (memoryUsedBytes / memoryTotalBytes) * 100
            : null;

        if (!cancelled) {
          setData({
            cpuPercent,
            memoryUsedBytes,
            memoryTotalBytes,
            memoryPercent,
            networkRxBps,
            networkTxBps,
          });
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch host metrics");
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
  }, [metricsHost, hostLoading, hostError, intervalMs]);

  return { data, loading, error };
}
