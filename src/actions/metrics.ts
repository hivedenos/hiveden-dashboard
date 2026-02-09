'use server';

interface MetricPoint {
  time: number;
  value: number;
}

export interface MetricVectorSample {
  labels: Record<string, string>;
  value: number;
}

export interface MetricResult {
  currentValue: number;
  history?: MetricPoint[];
  status: 'success' | 'error';
  error?: string;
}

export interface MetricVectorResult {
  samples: MetricVectorSample[];
  status: 'success' | 'error';
  error?: string;
}

function normalizePrometheusUrl(prometheusUrl: string): string {
  let baseUrl = prometheusUrl;
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  return baseUrl.replace(/\/$/, '');
}

export async function fetchMetric(
  prometheusUrl: string,
  query: string,
  rangeMinutes: number = 0
): Promise<MetricResult> {
  try {
    const baseUrl = normalizePrometheusUrl(prometheusUrl);

    // 1. Fetch Current Value (Instant Query)
    const instantUrl = new URL(`${baseUrl}/api/v1/query`);
    instantUrl.searchParams.append('query', query);
    
    //console.log(`Fetching instant metric: ${instantUrl.toString()}`);

    const instantRes = await fetch(instantUrl.toString(), { cache: 'no-store' });
    if (!instantRes.ok) {
        throw new Error(`Prometheus returned ${instantRes.status}: ${instantRes.statusText}`);
    }
    
    const instantData = await instantRes.json();
    
    if (instantData.status !== 'success') {
       throw new Error(`Prometheus query failed: ${instantData.errorType} - ${instantData.error}`);
    }

    let currentValue = 0;
    if (instantData.data.result.length > 0) {
        // value is [timestamp, "value"]
        currentValue = parseFloat(instantData.data.result[0].value[1]);
    }

    // 2. Fetch History if requested (Range Query)
    let history: MetricPoint[] = [];
    if (rangeMinutes > 0) {
        const end = Math.floor(Date.now() / 1000);
        const start = end - (rangeMinutes * 60);
        const step = Math.max(Math.floor((rangeMinutes * 60) / 30), 10); // Aim for ~30 points

        const rangeUrl = new URL(`${baseUrl}/api/v1/query_range`);
        rangeUrl.searchParams.append('query', query);
        rangeUrl.searchParams.append('start', start.toString());
        rangeUrl.searchParams.append('end', end.toString());
        rangeUrl.searchParams.append('step', step.toString());

        //console.log(`Fetching range metric: ${rangeUrl.toString()}`);

        const rangeRes = await fetch(rangeUrl.toString(), { cache: 'no-store' });
        if (rangeRes.ok) {
            const rangeData = await rangeRes.json();
             if (rangeData.status === 'success' && rangeData.data.result.length > 0) {
                // values is [[timestamp, "value"], ...]
                history = rangeData.data.result[0].values.map((v: any[]) => ({
                    time: v[0] * 1000,
                    value: parseFloat(v[1])
                }));
             }
        }
    }

    return {
        status: 'success',
        currentValue,
        history: history.length > 0 ? history : undefined
    };

  } catch (error: any) {
    console.error('Metric fetch error:', error);
    return {
        status: 'error',
        currentValue: 0,
        error: error.message || 'Unknown error'
    };
  }
}

export async function fetchMetricVector(
  prometheusUrl: string,
  query: string
): Promise<MetricVectorResult> {
  try {
    const baseUrl = normalizePrometheusUrl(prometheusUrl);
    const instantUrl = new URL(`${baseUrl}/api/v1/query`);
    instantUrl.searchParams.append('query', query);

    const response = await fetch(instantUrl.toString(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Prometheus returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Prometheus query failed: ${data.errorType} - ${data.error}`);
    }

    const samples: MetricVectorSample[] = Array.isArray(data.data?.result)
      ? data.data.result
          .map((entry: any) => {
            const rawValue = entry?.value?.[1];
            const numericValue = Number.parseFloat(rawValue);
            if (!Number.isFinite(numericValue)) {
              return null;
            }
            return {
              labels: (entry?.metric || {}) as Record<string, string>,
              value: numericValue,
            };
          })
          .filter((entry: MetricVectorSample | null): entry is MetricVectorSample => entry !== null)
      : [];

    return {
      status: 'success',
      samples,
    };
  } catch (error: any) {
    console.error('Metric vector fetch error:', error);
    return {
      status: 'error',
      samples: [],
      error: error.message || 'Unknown error',
    };
  }
}
