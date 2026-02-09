"use client";

import { getMetricsConfig } from "@/actions/system";
import { useEffect, useState } from "react";

export function usePrometheusHost() {
  const [host, setHost] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchHost = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMetricsConfig();
        const resolvedHost = response.host?.trim() || "";
        if (!isCancelled) {
          setHost(resolvedHost);
          if (!resolvedHost) {
            setError("Metrics endpoint does not provide a host.");
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setHost("");
          setError(err.message || "Failed to fetch metrics host");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchHost();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { host, loading, error };
}
