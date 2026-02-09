'use client';

import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconActivityHeartbeat, IconBrandDocker } from '@tabler/icons-react';
import { SystemMetricsGrid } from './Widgets/metrics/SystemMetricsGrid';
import { DockerFleetMetricsRow } from './Widgets/metrics/DockerFleetMetricsRow';

export function DashboardLayout() {
  return (
    <Stack gap="md">
      <Paper
        withBorder
        radius="md"
        p="md"
        style={{
          background:
            'linear-gradient(160deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 35%, transparent 100%)',
        }}
      >
        <Group align="flex-start" mb="md" wrap="nowrap">
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <IconActivityHeartbeat size={18} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={700} size="lg">
              Host Metrics
            </Text>
            <Text size="sm" c="dimmed">
              Live CPU, RAM, and network throughput from Prometheus.
            </Text>
          </Stack>
        </Group>

        <SystemMetricsGrid />
      </Paper>

      <Paper
        withBorder
        radius="md"
        p="md"
        style={{
          background:
            'linear-gradient(160deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 35%, transparent 100%)',
        }}
      >
        <Group align="flex-start" mb="md" wrap="nowrap">
          <ThemeIcon size="lg" radius="md" variant="light" color="green">
            <IconBrandDocker size={18} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={700} size="lg">
              Docker Fleet Metrics
            </Text>
            <Text size="sm" c="dimmed">
              Aggregate Docker CPU, RAM, container count, and network throughput.
            </Text>
          </Stack>
        </Group>

        <DockerFleetMetricsRow />
      </Paper>
    </Stack>
  );
}
