"use client";

import { fetchMetric } from "@/actions/metrics";
import { useEffect, useState } from "react";
import { buildContainerRegex, resolvePrometheusUrl } from "@/lib/prometheus";
import { usePrometheusHost } from "@/hooks/usePrometheusHost";

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
  const { host: metricsHost, loading: hostLoading, error: hostError } = usePrometheusHost();

  useEffect(() => {
    if (!containerName) {
      setData(null);
      setLoading(false);
      setError("Container name is missing");
      return;
    }

    let cancelled = false;
    const sourceHost = prometheusUrl || metricsHost;
    const url = resolvePrometheusUrl(sourceHost);
    if (!url) {
      setData(null);
      setLoading(hostLoading);
      setError(hostError || "Prometheus host is not configured in /system/metrics.");
      return;
    }
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

        const cpuValue = cpu.hasSample ? cpu.currentValue : null;
        const memoryUsedValue = memoryUsed.hasSample ? memoryUsed.currentValue : null;
        const memoryLimitValue = memoryLimit.hasSample && memoryLimit.currentValue > 0 ? memoryLimit.currentValue : null;
        const networkRxValue = networkRx.hasSample ? networkRx.currentValue : null;
        const networkTxValue = networkTx.hasSample ? networkTx.currentValue : null;
        const memoryPercent =
          memoryUsedValue !== null && memoryLimitValue !== null && memoryLimitValue > 0
            ? (memoryUsedValue / memoryLimitValue) * 100
            : null;

        if (!cancelled) {
          setData({
            cpuPercent: cpuValue,
            memoryUsedBytes: memoryUsedValue,
            memoryLimitBytes: memoryLimitValue,
            memoryPercent,
            networkRxBps: networkRxValue,
            networkTxBps: networkTxValue,
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
  }, [containerName, prometheusUrl, metricsHost, hostLoading, hostError, intervalMs]);

  return { data, loading, error };
}
