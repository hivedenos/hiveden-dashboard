"use client";

import { Card, Group, SimpleGrid, Skeleton, Stack, Text, Badge } from "@mantine/core";
import { useContainerMetrics } from "@/hooks/useContainerMetrics";
import { formatBytes } from "@/lib/format";

interface ContainerResourceCardsProps {
  containerName?: string;
  containerState?: string;
}

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

export function ContainerResourceCards({ containerName, containerState }: ContainerResourceCardsProps) {
  const { data, loading, error } = useContainerMetrics(containerName);
  const isRunning = (containerState || "").toLowerCase() === "running";
  const hasMetrics = Boolean(data);
  const cpuPercent = data?.cpuPercent ?? null;
  const memoryPercent = data?.memoryPercent ?? null;
  const memoryUsedBytes = data?.memoryUsedBytes ?? null;
  const memoryLimitBytes = data?.memoryLimitBytes ?? null;
  const networkRxBps = data?.networkRxBps ?? null;
  const networkTxBps = data?.networkTxBps ?? null;

  const cpuText = hasMetrics ? formatPercent(cpuPercent) : "N/A";
  const memoryPercentText = hasMetrics ? formatPercent(memoryPercent) : "N/A";
  const memoryDetail =
    hasMetrics && memoryUsedBytes !== null
      ? `${formatBytes(memoryUsedBytes || 0)} / ${memoryLimitBytes ? formatBytes(memoryLimitBytes) : "No limit"}`
      : "--";
  const networkText = hasMetrics ? `RX ${formatRate(networkRxBps)} · TX ${formatRate(networkTxBps)}` : "RX -- · TX --";

  const statusHint = error
    ? "Prometheus unavailable"
    : !isRunning
      ? "Container is stopped"
      : hasMetrics
        ? "Live sample"
        : "No metrics yet";

  const renderStatusBadge = () =>
    error ? (
      <Badge color="red" variant="light">
        Unavailable
      </Badge>
    ) : (
      <Badge color={isRunning ? "green" : "gray"} variant="light">
        {isRunning ? "Live" : "Stopped"}
      </Badge>
    );

  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} mb="md">
      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>CPU Usage</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {cpuText}
            </Text>
            <Text size="xs" c="dimmed">
              {statusHint}
            </Text>
          </Stack>
        )}
      </Card>

      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>RAM Usage</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {memoryPercentText}
            </Text>
            <Text size="xs" c="dimmed">
              {hasMetrics ? memoryDetail : statusHint}
            </Text>
          </Stack>
        )}
      </Card>

      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Network</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="lg">
              {networkText}
            </Text>
            <Text size="xs" c="dimmed">
              {hasMetrics ? "1 minute moving rate" : statusHint}
            </Text>
          </Stack>
        )}
      </Card>
    </SimpleGrid>
  );
}
