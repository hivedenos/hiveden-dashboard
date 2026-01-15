'use server';

export interface SystemMetricsData {
  cpu: { usage: number; history: number[] };
  memory: { usage: number; total: number; used: number; history: number[] };
  disk: { usage: number; total: number; used: number; history: number[] };
}

export async function getSystemMetrics(): Promise<SystemMetricsData> {
  throw new Error("Not implemented");
}
