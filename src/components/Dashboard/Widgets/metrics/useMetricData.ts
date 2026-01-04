"use client";

import { fetchMetric, MetricResult } from "@/actions/metrics";
import { useEffect, useState } from "react";

export interface BaseMetricProps {
  title?: string;
  description?: string;
  query: string;
  containerName?: string;
  unit?: string;
  color?: string;
  prometheusUrl?: string;
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatValue = (val: number, unit?: string) => {
  if (unit === "B" || unit === "GB" || unit === "MB") {
    return formatBytes(val);
  }
  return `${val.toFixed(1)}${unit || ""}`;
};

export const useMetricData = (props: BaseMetricProps, history: boolean) => {
  const { query, containerName, prometheusUrl } = props;
  const [data, setData] = useState<MetricResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // let url = prometheusUrl;
        let url = "http://192.168.0.10:9090";
        if (!url) {
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          let targetDomain = hostname;
          if (hostname.startsWith("dashboard.")) {
            targetDomain = hostname.replace("dashboard.", "prometheus.");
          } else if (hostname.startsWith("www.")) {
            targetDomain = hostname.replace("www.", "prometheus.");
          } else {
            targetDomain = `prometheus.${hostname}`;
          }
          url = `${protocol}//${targetDomain}`;
        }

        const safeName = containerName || ".*";
        const finalQuery = query.replace(/\$container/g, safeName);
        const range = history ? 30 : 0;

        const result = await fetchMetric(url, finalQuery, range);

        if (result.status === "error") {
          setError(result.error || "Failed to fetch");
        } else {
          setData(result);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [containerName, query, prometheusUrl, history]);

  return { data, loading, error };
};
