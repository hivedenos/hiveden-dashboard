"use client";

import { useEffect, useState } from 'react';
import { 
  Table, 
  Badge, 
  Group, 
  Text, 
  ActionIcon, 
  Pagination, 
  Stack, 
  TextInput, 
  Button, 
  Drawer, 
  Code, 
  ScrollArea,
  Box,
  LoadingOverlay
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconEye, IconRefresh, IconSearch, IconExternalLink } from '@tabler/icons-react';
import { getLogs } from '@/actions/logs';
import { LogEntry } from '@/lib/client';
import Link from 'next/link';

const LOG_LEVEL_COLORS: Record<string, string> = {
  error: 'red',
  critical: 'red',
  warn: 'orange',
  warning: 'orange',
  info: 'blue',
  debug: 'gray',
  trace: 'gray',
};

export default function LogsTable() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0); // API doesn't seem to return total count in LogListResponse based on context, so we might have to approximate or check if the API actually supports total. 
  // Looking at the context, LogListResponse only has { data: LogEntry[], status, message }. 
  // Standard offset pagination usually requires a total count for full numbered pagination. 
  // If not available, we might just have Next/Prev or load until empty.
  // For now, I'll assume infinite scrolling behavior or simple "Next" if explicit count is missing, 
  // but looking at standard practices, if the user asked for table, numbered pagination is best. 
  // I will assume for now we might not know the total, so I will handle "Next" availability by checking if we got full page size.
  
  const [levelFilter, setLevelFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [debouncedLevel] = useDebouncedValue(levelFilter, 500);
  const [debouncedModule] = useDebouncedValue(moduleFilter, 500);
  
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      // Fetching slightly more than page size to see if there is a next page if total isn't provided
      // Actually, let's stick to the requested contract.
      const response = await getLogs(pageSize, offset, debouncedLevel, debouncedModule);
      if (response && response.data) {
        setData(response.data);
        // Since we don't have total count in the response type shown in context, 
        // we will do a simple approximation for the pagination UI or just simple Next/Prev buttons if total is unknown.
        // However, Mantine Pagination requires `total` (number of pages).
        // Without a total count endpoint, I'll simulate a "lots of pages" or just use simple navigation.
        // Let's assume for this implementation we assume a high number or just hide numbers if we hit the end.
        // A better UX without total count is "Load More" or "Previous | Next". 
        // I will stick to standard Pagination but cap it or just allow navigation.
        // Let's guess: if we get < pageSize items, we are at the end.
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, debouncedLevel, debouncedModule]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedLevel, debouncedModule]);

  const rows = data.map((log) => (
    <Table.Tr key={log.id}>
      <Table.Td style={{ whiteSpace: 'nowrap' }}>
        <Text size="sm">{new Date(log.created_at).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={LOG_LEVEL_COLORS[log.level?.toLowerCase() || 'info'] || 'gray'} variant="light">
          {log.level}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>{log.module || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{log.actor}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{log.action || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" truncate="end" maw={300}>
          {log.message}
        </Text>
      </Table.Td>
      <Table.Td>
        <ActionIcon variant="subtle" color="gray" onClick={() => setSelectedLog(log)}>
          <IconEye size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <TextInput
            placeholder="Filter by level..."
            leftSection={<IconSearch size={16} />}
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.currentTarget.value)}
          />
          <TextInput
            placeholder="Filter by module..."
            leftSection={<IconSearch size={16} />}
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.currentTarget.value)}
          />
        </Group>
        <Button 
          variant="light" 
          leftSection={<IconRefresh size={16} />} 
          onClick={fetchLogs} 
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      <Box pos="relative">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <Table stickyHeader horizontalSpacing="md" verticalSpacing="sm" highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Timestamp</Table.Th>
              <Table.Th>Level</Table.Th>
              <Table.Th>Module</Table.Th>
              <Table.Th>Actor</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Message</Table.Th>
              <Table.Th w={60}>Details</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? rows : (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed" py="xl">
                    {loading ? 'Loading...' : 'No logs found'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>

      <Group justify="flex-end">
         {/* Simple pagination logic since we lack total count */}
        <Button 
          variant="default" 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <Button variant="default" disabled>
          Page {page}
        </Button>
        <Button 
          variant="default" 
          disabled={data.length < pageSize} 
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </Group>

      <Drawer
        opened={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={<Text fw={700} size="lg">Log Details</Text>}
        position="right"
        size="lg"
      >
        {selectedLog && (
          <Stack gap="md">
            <Group justify="space-between">
                <Badge size="lg" color={LOG_LEVEL_COLORS[selectedLog.level?.toLowerCase() || 'info'] || 'gray'}>
                    {selectedLog.level}
                </Badge>
                <Text size="sm" c="dimmed">{new Date(selectedLog.created_at).toLocaleString()}</Text>
            </Group>

            <Box>
                <Text fw={500} size="sm" c="dimmed">Message</Text>
                <Text size="lg">{selectedLog.message}</Text>
            </Box>

            <Group grow>
                <Box>
                    <Text fw={500} size="sm" c="dimmed">Module</Text>
                    <Text>{selectedLog.module || 'N/A'}</Text>
                </Box>
                <Box>
                    <Text fw={500} size="sm" c="dimmed">Action</Text>
                    <Text>{selectedLog.action || 'N/A'}</Text>
                </Box>
                 <Box>
                    <Text fw={500} size="sm" c="dimmed">Actor</Text>
                    <Text>{selectedLog.actor}</Text>
                </Box>
            </Group>

            {selectedLog.metadata && (
              <Box>
                <Text fw={500} size="sm" c="dimmed" mb="xs">Metadata</Text>
                <Code block>{JSON.stringify(selectedLog.metadata, null, 2)}</Code>
              </Box>
            )}

            {selectedLog.metadata?.redirect_url && (
                <Button 
                    component={Link} 
                    href={selectedLog.metadata.redirect_url as string}
                    rightSection={<IconExternalLink size={16} />}
                    variant="light"
                    fullWidth
                    mt="md"
                >
                    View Resource
                </Button>
            )}
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
