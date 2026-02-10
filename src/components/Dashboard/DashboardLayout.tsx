'use client';

import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconActivityHeartbeat, IconApps, IconBrandDocker } from '@tabler/icons-react';
import { SystemMetricsGrid } from './Widgets/metrics/SystemMetricsGrid';
import { DockerFleetMetricsRow } from './Widgets/metrics/DockerFleetMetricsRow';
import type { IngressContainerInfo } from '@/lib/client';
import { ApplicationsGrid } from './ApplicationsGrid';

interface DashboardLayoutProps {
  applications: IngressContainerInfo[];
}

export function DashboardLayout({ applications }: DashboardLayoutProps) {
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

      <Paper
        withBorder
        radius="md"
        p="md"
        style={{
          background:
            'linear-gradient(160deg, rgba(234,179,8,0.10) 0%, rgba(234,179,8,0.03) 35%, transparent 100%)',
        }}
      >
        <Group align="flex-start" mb="md" wrap="nowrap">
          <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
            <IconApps size={18} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={700} size="lg">
              Applications
            </Text>
            <Text size="sm" c="dimmed">
              Quick links to applications exposed through Traefik.
            </Text>
          </Stack>
        </Group>

        <ApplicationsGrid applications={applications} />
      </Paper>
    </Stack>
  );
}
