"use client";

import { Table, Group, Badge, Pagination, Stack, Select, Text, Checkbox, TextInput, Paper } from "@mantine/core";
import { IconCheck, IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import type { Container } from "@/lib/client";
import { ContainerActions } from "./ContainerActions";
import { useContainersMetricsMap } from "@/hooks/useContainersMetricsMap";
import { formatBytes } from "@/lib/format";
import { normalizeContainerName } from "@/lib/prometheus";

interface DockerListProps {
  containers: Container[];
  selectedRows: Set<string>;
  setSelectedRows: (rows: Set<string>) => void;
}

export function DockerList({ containers, selectedRows, setSelectedRows }: DockerListProps) {
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>("10");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const containerNames = useMemo(() => containers.map((container) => container.Name || ""), [containers]);
  const { data: metricsMap, error: metricsError } = useContainersMetricsMap(containerNames);

  // Check if container is managed by Hiveden (has hiveden label)
  const isManagedByHiveden = (container: Container): boolean => {
    return !!(container.Labels && container.Labels["managed-by"] === "hiveden");
  };

  const filteredContainers = containers.filter((container) => {
    const matchesQuery =
      query.trim().length === 0 ||
      container.Name?.toLowerCase().includes(query.toLowerCase()) ||
      container.Image?.toLowerCase().includes(query.toLowerCase());
    const matchesState = stateFilter === "all" || (container.State || "").toLowerCase() === stateFilter;
    return matchesQuery && matchesState;
  });

  // Pagination logic
  const itemsPerPageNum = parseInt(itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredContainers.length / itemsPerPageNum));
  const startIndex = (activePage - 1) * itemsPerPageNum;
  const endIndex = startIndex + itemsPerPageNum;
  const paginatedContainers = filteredContainers.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: string | null) => {
    if (value) {
      setItemsPerPage(value);
      setActivePage(1);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActivePage(1);
  };

  const handleStateFilterChange = (value: string | null) => {
    setStateFilter(value || "all");
    setActivePage(1);
  };

  // Row selection handlers
  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === paginatedContainers.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedContainers.map((c) => c.Id)));
    }
  };

  const allSelected = paginatedContainers.length > 0 && selectedRows.size === paginatedContainers.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < paginatedContainers.length;

  const formatCpu = (cpuPercent: number | null): { label: string; color: string } => {
    if (cpuPercent === null || !Number.isFinite(cpuPercent)) {
      return { label: "No data", color: "gray" };
    }

    if (cpuPercent < 40) return { label: `${cpuPercent.toFixed(1)}%`, color: "green" };
    if (cpuPercent < 75) return { label: `${cpuPercent.toFixed(1)}%`, color: "yellow" };
    return { label: `${cpuPercent.toFixed(1)}%`, color: "red" };
  };

  const formatRate = (value: number | null): string => {
    if (value === null || !Number.isFinite(value)) return "--";
    return `${formatBytes(value)}/s`;
  };

  const hasAnyMetrics = Object.values(metricsMap).some(
    (metric) => metric.cpuPercent !== null || metric.networkRxBps !== null || metric.networkTxBps !== null
  );

  useEffect(() => {
    if (activePage > totalPages) {
      setActivePage(totalPages);
    }
  }, [activePage, totalPages]);

  const rows = paginatedContainers.map((container) => {
    const metric = metricsMap[normalizeContainerName(container.Name)];
    const cpuMetric = formatCpu(metric?.cpuPercent ?? null);
    const rxRate = formatRate(metric?.networkRxBps ?? null);
    const txRate = formatRate(metric?.networkTxBps ?? null);

    return (
      <Table.Tr key={container.Id} bg={selectedRows.has(container.Id) ? "var(--mantine-color-blue-light)" : undefined}>
        <Table.Td>
          <Checkbox checked={selectedRows.has(container.Id)} onChange={() => toggleRow(container.Id)} />
        </Table.Td>
        <Table.Td>{container.Name}</Table.Td>
        <Table.Td>{container.Image}</Table.Td>
        <Table.Td>
          <Badge color={container.State === "running" ? "green" : "gray"}>{container.State || "Unknown"}</Badge>
        </Table.Td>
        <Table.Td>
          <Badge variant="light" color={cpuMetric.color}>
            {cpuMetric.label}
          </Badge>
        </Table.Td>
        <Table.Td>
          {!metric || (metric.networkRxBps === null && metric.networkTxBps === null) ? (
            <Text size="xs" c="dimmed">
              No data
            </Text>
          ) : (
            <Stack gap={2}>
              <Text size="xs">RX {rxRate}</Text>
              <Text size="xs">TX {txRate}</Text>
            </Stack>
          )}
        </Table.Td>
        <Table.Td>
          {isManagedByHiveden(container) ? (
            <Badge color="blue" leftSection={<IconCheck size={12} />}>
              Managed
            </Badge>
          ) : (
            <Badge color="gray" leftSection={<IconX size={12} />}>
              Unmanaged
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          <ContainerActions containerId={container.Id} containerState={container.State || "unknown"} size="small" />
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="sm">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Group>
            <TextInput
              label="Search"
              placeholder="Name or image"
              leftSection={<IconSearch size={16} />}
              value={query}
              onChange={(event) => handleQueryChange(event.currentTarget.value)}
              w={240}
            />
            <Select
              label="State"
              value={stateFilter}
              onChange={handleStateFilterChange}
              data={[
                { value: "all", label: "All states" },
                { value: "running", label: "Running" },
                { value: "exited", label: "Exited" },
                { value: "created", label: "Created" },
              ]}
              w={160}
            />
          </Group>
          <Text size="sm" c="dimmed">
            Showing {paginatedContainers.length} of {filteredContainers.length} containers
          </Text>
        </Group>
      </Paper>

      {metricsError && (
        <Text size="sm" c="yellow">
          Live metrics unavailable: {metricsError}
        </Text>
      )}
      {!metricsError && !hasAnyMetrics && filteredContainers.length > 0 && (
        <Text size="sm" c="dimmed">
          No Prometheus container metrics available yet. CPU and Network values will appear when samples are scraped.
        </Text>
      )}
      <Table striped highlightOnHover withTableBorder stickyHeader horizontalSpacing="md" verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Image</Table.Th>
            <Table.Th>State</Table.Th>
            <Table.Th>CPU</Table.Th>
            <Table.Th>Network</Table.Th>
            <Table.Th>Managed</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={8}>
                <Text ta="center" c="dimmed" py="md">
                  No containers match your filters.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {filteredContainers.length > 10 && (
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm">Items per page:</Text>
            <Select value={itemsPerPage} onChange={handleItemsPerPageChange} data={["10", "25", "50", "100"]} w={80} />
          </Group>
          <Pagination value={activePage} onChange={setActivePage} total={totalPages} />
        </Group>
      )}
    </Stack>
  );
}
