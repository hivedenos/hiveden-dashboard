import { MetricCard } from "./MetricCard";
import { Group, Text } from "@mantine/core";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { formatBytes } from "@/lib/format";

interface DiskMetricProps {
  data?: { usage: number; total: number; used: number; history: number[] };
  loading?: boolean;
  error?: string | null;
}

export function DiskMetric({ data, loading, error }: DiskMetricProps) {
  const chartData = data?.history.map((val, index) => ({ index, value: val })) || [];

  return (
    <MetricCard title="Disk" loading={loading} error={error}>
      <Group align="flex-end" justify="space-between" style={{ height: 60 }}>
        <div>
           <Text fw={700} size="xl" lh={1} style={{ fontSize: '2rem' }}>
             {data ? Math.round(data.usage) : 0}%
           </Text>
           <Text size="xs" c="dimmed">
             {data ? `${formatBytes(data.used)} / ${formatBytes(data.total)}` : '- / -'}
           </Text>
        </div>
        
        <div style={{ width: '50%', height: '100%' }}>
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                 <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--mantine-color-teal-6)" 
                    fill="var(--mantine-color-teal-6)" 
                    fillOpacity={0.2} 
                    isAnimationActive={false} 
                    strokeWidth={2}
                 />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </Group>
    </MetricCard>
  );
}
