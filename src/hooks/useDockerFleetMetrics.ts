"use client";

import { fetchMetric } from "@/actions/metrics";
import { useEffect, useState } from "react";
import { resolvePrometheusUrl } from "@/lib/prometheus";
import { usePrometheusHost } from "@/hooks/usePrometheusHost";

export interface DockerFleetMetricsData {
  runningContainers: number | null;
  cpuPercent: number | null;
  memoryBytes: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
}

export function useDockerFleetMetrics(intervalMs = 10000) {
  const [data, setData] = useState<DockerFleetMetricsData | null>(null);
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

    const runningContainersQuery = 'count(container_last_seen{name!=""})';
    const cpuQuery = 'sum(rate(container_cpu_usage_seconds_total{name!=""}[1m])) * 100';
    const memoryQuery = 'sum(container_memory_usage_bytes{name!=""})';
    const networkRxQuery = 'sum(rate(container_network_receive_bytes_total{name!=""}[1m]))';
    const networkTxQuery = 'sum(rate(container_network_transmit_bytes_total{name!=""}[1m]))';

    const loadData = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        const [running, cpu, memory, networkRx, networkTx] = await Promise.all([
          fetchMetric(prometheusUrl, runningContainersQuery),
          fetchMetric(prometheusUrl, cpuQuery),
          fetchMetric(prometheusUrl, memoryQuery),
          fetchMetric(prometheusUrl, networkRxQuery),
          fetchMetric(prometheusUrl, networkTxQuery),
        ]);

        const firstError = [running, cpu, memory, networkRx, networkTx].find((metric) => metric.status === "error");
        if (firstError?.status === "error") {
          throw new Error(firstError.error || "Failed to load Docker fleet metrics");
        }

        if (!cancelled) {
          setData({
            runningContainers: running.hasSample ? Math.max(0, Math.round(running.currentValue)) : null,
            cpuPercent: cpu.hasSample ? cpu.currentValue : null,
            memoryBytes: memory.hasSample ? memory.currentValue : null,
            networkRxBps: networkRx.hasSample ? networkRx.currentValue : null,
            networkTxBps: networkTx.hasSample ? networkTx.currentValue : null,
          });
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to fetch Docker fleet metrics");
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
