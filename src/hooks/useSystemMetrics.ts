import { useState, useEffect } from "react";
import { getSystemMetrics, SystemMetricsData } from "@/actions/system-metrics";

export function useSystemMetrics(intervalMs: number = 5000) {
  const [data, setData] = useState<SystemMetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      try {
        const result = await getSystemMetrics();
        if (isMounted) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to fetch metrics");
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchMetrics();

    // Poll
    const intervalId = setInterval(fetchMetrics, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [intervalMs]);

  return { data, loading, error };
}
