"use client";

import { getLogs } from "@/actions/logs";
import { LogEntry } from "@/lib/client";
import { ActionIcon, Badge, Box, Button, Card, Drawer, Group, LoadingOverlay, Paper, ScrollArea, SimpleGrid, Stack, Table, Text, TextInput, ThemeIcon } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconAlertTriangle, IconClockHour4, IconEye, IconExternalLink, IconRefresh, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const LOG_LEVEL_COLORS: Record<string, string> = {
  error: "red",
  critical: "red",
  warn: "orange",
  warning: "orange",
  info: "blue",
  debug: "gray",
  trace: "gray",
};

export default function LogsTable() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [levelFilter, setLevelFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [debouncedLevel] = useDebouncedValue(levelFilter, 400);
  const [debouncedModule] = useDebouncedValue(moduleFilter, 400);

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const response = await getLogs(pageSize, offset, debouncedLevel, debouncedModule);
      if (response?.data) {
        setData(response.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedLevel, debouncedModule]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedLevel, debouncedModule]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of data) {
      const level = (log.level || "unknown").toLowerCase();
      counts[level] = (counts[level] || 0) + 1;
    }
    return counts;
  }, [data]);

  const rows = data.map((log) => (
    <Table.Tr key={log.id}>
      <Table.Td style={{ whiteSpace: "nowrap" }}>
        <Text size="sm">{new Date(log.created_at).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={LOG_LEVEL_COLORS[(log.level || "info").toLowerCase()] || "gray"} variant="light">
          {log.level}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={600}>
          {log.module || "-"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{log.actor || "-"}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{log.action || "-"}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" truncate="end" maw={420}>
          {log.message}
        </Text>
      </Table.Td>
      <Table.Td>
        <ActionIcon variant="light" color="gray" onClick={() => setSelectedLog(log)} aria-label="View log details">
          <IconEye size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Current Page
            </Text>
            <ThemeIcon size="sm" variant="light" color="blue">
              <IconClockHour4 size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt={4}>
            {data.length}
          </Text>
          <Text size="xs" c="dimmed">
            Logs shown
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Errors
            </Text>
            <ThemeIcon size="sm" variant="light" color="red">
              <IconAlertTriangle size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt={4}>
            {(levelCounts.error || 0) + (levelCounts.critical || 0)}
          </Text>
          <Text size="xs" c="dimmed">
            Error + critical
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Warnings
            </Text>
            <ThemeIcon size="sm" variant="light" color="orange">
              <IconAlertTriangle size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt={4}>
            {(levelCounts.warn || 0) + (levelCounts.warning || 0)}
          </Text>
          <Text size="xs" c="dimmed">
            Warning events
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Info
            </Text>
            <ThemeIcon size="sm" variant="light" color="teal">
              <IconClockHour4 size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt={4}>
            {levelCounts.info || 0}
          </Text>
          <Text size="xs" c="dimmed">
            Informational logs
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="lg" p="md">
        <Group justify="space-between" align="flex-end" gap="md">
          <Group>
            <TextInput
              label="Level"
              placeholder="error, warn, info..."
              leftSection={<IconSearch size={16} />}
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.currentTarget.value)}
            />
            <TextInput
              label="Module"
              placeholder="docker, system..."
              leftSection={<IconSearch size={16} />}
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.currentTarget.value)}
            />
          </Group>
          <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={fetchLogs} loading={loading}>
            Refresh
          </Button>
        </Group>
      </Paper>

      <Card withBorder radius="lg" p="md">
        <Box pos="relative">
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          <ScrollArea>
            <Table stickyHeader horizontalSpacing="md" verticalSpacing="sm" highlightOnHover withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Level</Table.Th>
                  <Table.Th>Module</Table.Th>
                  <Table.Th>Actor</Table.Th>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>Message</Table.Th>
                  <Table.Th w={64}>Details</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="xl">
                        {loading ? "Loading logs..." : "No logs found for current filters."}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Box>
      </Card>

      <Group justify="flex-end">
        <Button variant="default" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button variant="default" disabled>
          Page {page}
        </Button>
        <Button variant="default" disabled={data.length < pageSize} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </Group>

      <Drawer opened={!!selectedLog} onClose={() => setSelectedLog(null)} title={<Text fw={700}>Log Details</Text>} position="right" size="lg">
        {selectedLog && (
          <Stack gap="md">
            <Group justify="space-between">
              <Badge size="lg" color={LOG_LEVEL_COLORS[(selectedLog.level || "info").toLowerCase()] || "gray"} variant="light">
                {selectedLog.level}
              </Badge>
              <Text size="sm" c="dimmed">
                {new Date(selectedLog.created_at).toLocaleString()}
              </Text>
            </Group>

            <Box>
              <Text fw={500} size="sm" c="dimmed">
                Message
              </Text>
              <Text size="lg">{selectedLog.message}</Text>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Box>
                <Text fw={500} size="sm" c="dimmed">
                  Module
                </Text>
                <Text>{selectedLog.module || "N/A"}</Text>
              </Box>
              <Box>
                <Text fw={500} size="sm" c="dimmed">
                  Action
                </Text>
                <Text>{selectedLog.action || "N/A"}</Text>
              </Box>
              <Box>
                <Text fw={500} size="sm" c="dimmed">
                  Actor
                </Text>
                <Text>{selectedLog.actor || "N/A"}</Text>
              </Box>
            </SimpleGrid>

            {selectedLog.metadata && (
              <Box>
                <Text fw={500} size="sm" c="dimmed" mb="xs">
                  Metadata
                </Text>
                <Text ff="monospace" size="xs" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </Text>
              </Box>
            )}

            {selectedLog.metadata?.redirect_url && (
              <Button component={Link} href={selectedLog.metadata.redirect_url as string} rightSection={<IconExternalLink size={16} />} variant="light" fullWidth>
                View Resource
              </Button>
            )}
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
