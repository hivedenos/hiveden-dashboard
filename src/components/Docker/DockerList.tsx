"use client";

import { Table, Group, Badge, Pagination, Stack, Select, Text, Checkbox } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useState } from "react";
import type { Container } from "@/lib/client";
import { ContainerActions } from "./ContainerActions";

interface DockerListProps {
  containers: Container[];
  selectedRows: Set<string>;
  setSelectedRows: (rows: Set<string>) => void;
}

export function DockerList({ containers, selectedRows, setSelectedRows }: DockerListProps) {
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<string>("10");

  // Check if container is managed by Hiveden (has hiveden label)
  const isManagedByHiveden = (container: Container): boolean => {
    return !!(container.Labels && container.Labels["managed-by"] === "hiveden");
  };

  // Pagination logic
  const itemsPerPageNum = parseInt(itemsPerPage);
  const totalPages = Math.ceil(containers.length / itemsPerPageNum);
  const startIndex = (activePage - 1) * itemsPerPageNum;
  const endIndex = startIndex + itemsPerPageNum;
  const paginatedContainers = containers.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: string | null) => {
    if (value) {
      setItemsPerPage(value);
      setActivePage(1);
    }
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

  const rows = paginatedContainers.map((container) => (
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
  ));

  return (
    <Stack gap="md">
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Image</Table.Th>
            <Table.Th>State</Table.Th>
            <Table.Th>Managed</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      {containers.length > 10 && (
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