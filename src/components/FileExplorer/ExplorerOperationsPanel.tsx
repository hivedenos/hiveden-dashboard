'use client';

import { ActionIcon, Badge, Card, Group, Progress, ScrollArea, Stack, Text } from '@mantine/core';
import { IconPlayerStop, IconRefresh, IconReload, IconTrash, IconWaveSine } from '@tabler/icons-react';

import { useExplorer } from './ExplorerProvider';

export function ExplorerOperationsPanel({ compact = false }: { compact?: boolean }) {
  const { operations, refreshOperations, dismissOperation, cancelOperation, retryOperation } = useExplorer();
  const activeUploads = operations.filter(
    (operation) => operation.operation_type.includes('upload') && (operation.status === 'pending' || operation.status === 'in_progress'),
  );

  return (
    <Card
      withBorder
      radius={compact ? 'md' : 0}
      padding="md"
      style={{
        width: compact ? '100%' : 320,
        height: '100%',
        borderLeft: compact ? undefined : '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)',
      }}
    >
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="center">
          <Stack gap={0}>
          <Group gap="xs">
            <IconWaveSine size={16} />
            <Text fw={700} size="sm">Operations</Text>
          </Group>
          {activeUploads.length > 0 ? (
            <Text size="xs" c="dimmed">
              Uploading {activeUploads.length} batch{activeUploads.length === 1 ? '' : 'es'}...
            </Text>
          ) : null}
          </Stack>
          <ActionIcon variant="subtle" size="sm" aria-label="Refresh operations" onClick={refreshOperations}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>

        {operations.length === 0 ? (
          <Stack justify="center" align="center" gap="xs" style={{ flex: 1 }}>
            <Text fw={600}>No recent activity</Text>
            <Text size="sm" c="dimmed" ta="center">Search, paste, rename, or delete actions will appear here.</Text>
          </Stack>
        ) : (
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap="sm">
              {operations.map((operation) => {
                const progress = Math.max(0, Math.min(100, operation.progress ?? 0));
                const isDone = operation.status === 'completed';
                const isCancelled = operation.status === 'cancelled';
                const isError = operation.status === 'failed' || isCancelled;
                const isActive = operation.status === 'in_progress' || operation.status === 'pending';
                const result = parseOperationResult(operation.result);
                const summary = getSummary(result);
                const fileRows = getFileRows(result);
                const byteProgress = getByteProgress(result);
                const canRetryUpload = (isCancelled || operation.status === 'failed') && operation.operation_type.includes('upload');

                return (
                  <Card key={operation.id} withBorder padding="sm" radius="md">
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Text fw={600} size="sm" tt="capitalize">{operation.operation_type.replace(/_/g, ' ')}</Text>
                          <Text size="xs" c="dimmed">{formatDate(operation.updated_at ?? operation.created_at)}</Text>
                        </div>
                        <Group gap={6} wrap="nowrap">
                          <Badge color={isError ? 'red' : isDone ? 'green' : 'blue'} variant="light">
                            {operation.status}
                          </Badge>
                          {isActive ? (
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              size="sm"
                              aria-label={`Cancel ${operation.operation_type} operation`}
                              onClick={() => void cancelOperation(operation.id)}
                            >
                              <IconPlayerStop size={14} />
                            </ActionIcon>
                          ) : null}
                          {canRetryUpload ? (
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              size="sm"
                              aria-label={`Retry ${operation.operation_type} operation`}
                              onClick={() => void retryOperation(operation.id)}
                            >
                              <IconReload size={14} />
                            </ActionIcon>
                          ) : null}
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            aria-label={`Dismiss ${operation.operation_type} operation`}
                            onClick={() => void dismissOperation(operation.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      <Progress value={isDone ? 100 : progress} color={isError ? 'red' : 'blue'} radius="xl" size="sm" />

                      <Group justify="space-between" gap="xs">
                        <Text size="xs" c="dimmed">
                          {summary?.processed_items ?? operation.processed_items ?? 0}/{summary?.total_items ?? operation.total_items ?? 0} items
                        </Text>
                        <Text size="xs" c="dimmed">{isDone ? 'Done' : isCancelled ? 'Cancelled' : `${Math.round(isDone ? 100 : progress)}%`}</Text>
                      </Group>

                      {byteProgress ? (
                        <Text size="xs" c="dimmed">
                          {formatBytes(byteProgress.uploaded)} / {formatBytes(byteProgress.total)}
                        </Text>
                      ) : null}

                      {summary ? (
                        <Group gap="xs" wrap="wrap">
                          {summary.created ? <Badge variant="outline" color="green">{summary.created} created</Badge> : null}
                          {summary.overwritten ? <Badge variant="outline" color="blue">{summary.overwritten} overwritten</Badge> : null}
                          {summary.skipped ? <Badge variant="outline" color="yellow">{summary.skipped} skipped</Badge> : null}
                          {summary.failed ? <Badge variant="outline" color="red">{summary.failed} failed</Badge> : null}
                          {summary.cancelled ? <Badge variant="outline" color="gray">{summary.cancelled} cancelled</Badge> : null}
                        </Group>
                      ) : null}

                      {operation.destination_path ? (
                        <Text size="xs" c="dimmed" truncate>Destination: {operation.destination_path}</Text>
                      ) : null}

                      {fileRows.length > 0 ? (
                        <Stack gap={4}>
                          {fileRows.slice(0, compact ? 3 : 5).map((file) => (
                            <Card key={`${operation.id}-${file.name}`} withBorder padding="xs" radius="sm">
                            <Stack gap={2}>
                              <Group justify="space-between" gap="xs" wrap="nowrap">
                                <Text size="xs" truncate>{file.name}</Text>
                                <Badge variant="light" color={outcomeColor(file.outcome)}>{file.outcome ?? file.status ?? 'pending'}</Badge>
                              </Group>
                              {typeof file.progress === 'number' ? <Progress value={file.progress} size="xs" radius="xl" /> : null}
                              <Group justify="space-between" gap="xs">
                                <Text size="xs" c="dimmed">{formatBytes(file.uploaded_bytes ?? 0)} / {formatBytes(file.size ?? 0)}</Text>
                                {file.error_message ? <Text size="xs" c="red">{file.error_message}</Text> : null}
                              </Group>
                            </Stack>
                            </Card>
                          ))}
                        </Stack>
                      ) : null}

                      {operation.error_message ? (
                        <Text size="xs" c="red">{operation.error_message}</Text>
                      ) : null}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Card>
  );
}

function parseOperationResult(result: unknown): Record<string, unknown> | null {
  if (!result) return null;
  if (typeof result === 'string') {
    try {
      return JSON.parse(result) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return typeof result === 'object' ? (result as Record<string, unknown>) : null;
}

function getSummary(result: Record<string, unknown> | null) {
  if (!result || typeof result.summary !== 'object' || !result.summary) return null;
  return result.summary as Record<string, number>;
}

function getByteProgress(result: Record<string, unknown> | null) {
  const uploaded = typeof result?.uploaded_bytes === 'number' ? result.uploaded_bytes : null;
  const total = typeof result?.total_bytes === 'number' ? result.total_bytes : null;
  return uploaded !== null && total !== null ? { uploaded, total } : null;
}

function getFileRows(result: Record<string, unknown> | null) {
  if (!result || !Array.isArray(result.files)) return [];
  return result.files.map((file) => {
    const item = typeof file === 'object' && file ? (file as Record<string, unknown>) : {};
    const nestedResult = typeof item.result === 'object' && item.result ? (item.result as Record<string, unknown>) : {};
    return {
      name: typeof item.name === 'string' ? item.name : 'Unknown file',
      size: typeof item.size === 'number' ? item.size : undefined,
      uploaded_bytes: typeof item.uploaded_bytes === 'number' ? item.uploaded_bytes : undefined,
      progress: typeof item.progress === 'number' ? item.progress : undefined,
      status: typeof item.status === 'string' ? item.status : undefined,
      error_message: typeof item.error_message === 'string' ? item.error_message : undefined,
      outcome: typeof nestedResult.outcome === 'string' ? nestedResult.outcome : undefined,
    };
  });
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function outcomeColor(outcome?: string) {
  switch (outcome) {
    case 'created':
      return 'green';
    case 'overwritten':
      return 'blue';
    case 'skipped':
      return 'yellow';
    case 'failed':
      return 'red';
    case 'cancelled':
      return 'gray';
    default:
      return 'blue';
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString();
}
