"use client";

import { Badge, Card, Group, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import { formatBytes } from "@/lib/format";
import type { HostMetricsData } from "@/hooks/useHostMetrics";

interface HostResourceCardsProps {
  data: HostMetricsData | null;
  loading: boolean;
  error: string | null;
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

export function HostResourceCards({ data, loading, error }: HostResourceCardsProps) {
  const hasMetrics = Boolean(data);
  const cpuPercent = data?.cpuPercent ?? null;
  const memoryPercent = data?.memoryPercent ?? null;
  const memoryUsedBytes = data?.memoryUsedBytes ?? null;
  const memoryTotalBytes = data?.memoryTotalBytes ?? null;
  const networkRxBps = data?.networkRxBps ?? null;
  const networkTxBps = data?.networkTxBps ?? null;

  const statusHint = error ? "Prometheus unavailable" : hasMetrics ? "Live sample" : "No metrics yet";

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

  return (
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>CPU</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {formatPercent(cpuPercent)}
            </Text>
            <Text size="xs" c="dimmed">
              {statusHint}
            </Text>
          </Stack>
        )}
      </Card>

      <Card withBorder radius="md" padding="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>RAM</Text>
          {renderStatusBadge()}
        </Group>
        {loading ? (
          <Skeleton h={48} radius="sm" />
        ) : (
          <Stack gap={2}>
            <Text fw={700} size="xl">
              {formatPercent(memoryPercent)}
            </Text>
            <Text size="xs" c="dimmed">
              {memoryUsedBytes !== null ? `${formatBytes(memoryUsedBytes)} / ${memoryTotalBytes ? formatBytes(memoryTotalBytes) : "--"}` : statusHint}
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
          <Stack gap={4}>
            <Group gap={6}>
              <IconArrowDown size={16} aria-label="Download" />
              <Text fw={600} size="sm">RX {formatRate(networkRxBps)}</Text>
            </Group>
            <Group gap={6}>
              <IconArrowUp size={16} aria-label="Upload" />
              <Text fw={600} size="sm">TX {formatRate(networkTxBps)}</Text>
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
