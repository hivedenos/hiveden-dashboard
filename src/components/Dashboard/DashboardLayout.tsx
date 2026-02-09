'use client';

import { Paper, Stack, Text } from '@mantine/core';
import { SystemMetricsGrid } from './Widgets/metrics/SystemMetricsGrid';

export function DashboardLayout() {
  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <Stack gap={4}>
          <Text fw={700} size="lg">
            Host Metrics
          </Text>
          <Text size="sm" c="dimmed">
            Live CPU, RAM, and network throughput from Prometheus.
          </Text>
        </Stack>

        <SystemMetricsGrid />
      </Paper>
    </Stack>
  );
}
