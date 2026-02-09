"use client";

import { fetchMetricVector, type MetricVectorSample } from "@/actions/metrics";
import { useEffect, useMemo, useState } from "react";
import { normalizeContainerName, resolvePrometheusUrl } from "@/lib/prometheus";

export interface ContainerListMetric {
  cpuPercent: number | null;
  networkRxBps: number | null;
  networkTxBps: number | null;
}

function extractMetricName(labels: Record<string, string>): string {
  return labels.name || labels.container || labels.container_name || "";
}

function samplesToMap(samples: MetricVectorSample[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const sample of samples) {
    const key = normalizeContainerName(extractMetricName(sample.labels));
    if (!key) continue;
    map.set(key, sample.value);
  }

  return map;
}

export function useContainersMetricsMap(containerNames: string[], prometheusUrl?: string, intervalMs = 10000) {
  const [data, setData] = useState<Record<string, ContainerListMetric>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedNames = useMemo(() => containerNames.map((name) => normalizeContainerName(name)), [containerNames]);

  useEffect(() => {
    if (normalizedNames.length === 0) {
      setData({});
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const url = resolvePrometheusUrl(prometheusUrl);

    const cpuQuery = 'sum by (name) (rate(container_cpu_usage_seconds_total{name!=""}[1m])) * 100';
    const networkRxQuery = 'sum by (name) (rate(container_network_receive_bytes_total{name!=""}[1m]))';
    const networkTxQuery = 'sum by (name) (rate(container_network_transmit_bytes_total{name!=""}[1m]))';

    const loadData = async () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        const [cpuResult, networkRxResult, networkTxResult] = await Promise.all([
          fetchMetricVector(url, cpuQuery),
          fetchMetricVector(url, networkRxQuery),
          fetchMetricVector(url, networkTxQuery),
        ]);

        const firstError = [cpuResult, networkRxResult, networkTxResult].find((metric) => metric.status === "error");
        if (firstError?.status === "error") {
          throw new Error(firstError.error || "Failed to load container list metrics");
        }

        const cpuMap = samplesToMap(cpuResult.samples);
        const rxMap = samplesToMap(networkRxResult.samples);
        const txMap = samplesToMap(networkTxResult.samples);

        const merged: Record<string, ContainerListMetric> = {};
        for (const name of normalizedNames) {
          merged[name] = {
            cpuPercent: cpuMap.get(name) ?? null,
            networkRxBps: rxMap.get(name) ?? null,
            networkTxBps: txMap.get(name) ?? null,
          };
        }

        if (!cancelled) {
          setData(merged);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load metrics");
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
  }, [normalizedNames, prometheusUrl, intervalMs]);

  return { data, loading, error };
}
