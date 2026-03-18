'use client';

import { ActionIcon, Badge, Card, Group, Progress, ScrollArea, Stack, Text } from '@mantine/core';
import { IconRefresh, IconTrash, IconWaveSine } from '@tabler/icons-react';

import { useExplorer } from './ExplorerProvider';

export function ExplorerOperationsPanel({ compact = false }: { compact?: boolean }) {
  const { operations, refresh, dismissOperation } = useExplorer();

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
          <Group gap="xs">
            <IconWaveSine size={16} />
            <Text fw={700} size="sm">Operations</Text>
          </Group>
          <ActionIcon variant="subtle" size="sm" aria-label="Refresh operations" onClick={refresh}>
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
                const isError = operation.status === 'failed' || operation.status === 'cancelled';

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
                          {operation.processed_items ?? 0}/{operation.total_items ?? 0} items
                        </Text>
                        <Text size="xs" c="dimmed">{isDone ? 'Done' : `${Math.round(isDone ? 100 : progress)}%`}</Text>
                      </Group>

                      {operation.destination_path ? (
                        <Text size="xs" c="dimmed" truncate>Destination: {operation.destination_path}</Text>
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

function formatDate(value?: string | null) {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString();
}
