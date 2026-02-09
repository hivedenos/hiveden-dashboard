"use client";

import { Badge, Card, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import { formatBytes } from "@/lib/format";
import { useDockerFleetMetrics } from "@/hooks/useDockerFleetMetrics";

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${value.toFixed(1)}%`;
}

function formatRate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  return `${formatBytes(value)}/s`;
}

function formatMemory(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  return formatBytes(value);
}

export function DockerFleetMetricsRow() {
  const { data, loading, error } = useDockerFleetMetrics();
  const hasMetrics = Boolean(data);

  const renderStatusBadge = () =>
    error ? (
      <Badge color="red" variant="light">
        Unavailable
      </Badge>
    ) : (
      <Badge color={hasMetrics ? "green" : "gray"} variant="light">
        {hasMetrics ? "Live" : "No Data"}
      </Badge>
    );

  const statusHint = error ? "Prometheus unavailable" : hasMetrics ? "Live sample" : "No metrics yet";

  return (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md">
      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Running Containers</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {data?.runningContainers ?? "N/A"}
            </Text>
            <Text size="xs" c="dimmed">
              {hasMetrics ? "Containers reporting metrics" : statusHint}
            </Text>
          </Stack>
        )}
      </Card>

      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Docker CPU</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {formatPercent(data?.cpuPercent ?? null)}
            </Text>
            <Text size="xs" c="dimmed">
              {statusHint}
            </Text>
          </Stack>
        )}
      </Card>

      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Docker RAM</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {formatMemory(data?.memoryBytes ?? null)}
            </Text>
            <Text size="xs" c="dimmed">
              {statusHint}
            </Text>
          </Stack>
        )}
      </Card>

      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Docker Network</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={4}>
            <Group gap={6}>
              <IconArrowDown size={16} aria-label="Docker download" />
              <Text fw={600} size="sm">RX {formatRate(data?.networkRxBps ?? null)}</Text>
            </Group>
            <Group gap={6}>
              <IconArrowUp size={16} aria-label="Docker upload" />
              <Text fw={600} size="sm">TX {formatRate(data?.networkTxBps ?? null)}</Text>
            </Group>
            <Text size="xs" c="dimmed">
              {hasMetrics ? "1 minute moving rate" : statusHint}
            </Text>
          </Stack>
        )}
      </Card>
    </SimpleGrid>
  );
}
