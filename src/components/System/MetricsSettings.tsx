'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Code,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconRefresh, IconServer, IconTopologyStar3 } from '@tabler/icons-react';
import { getMetricsConfig } from '@/actions/system';
import type { MetricsConfigResponse } from '@/lib/client';
import { resolvePrometheusUrl } from '@/lib/prometheus';

export function MetricsSettings() {
  const [data, setData] = useState<MetricsConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getMetricsConfig();
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load metrics configuration');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const dependencyContainers = data?.dependencies?.containers ?? [];
  const hasHost = Boolean(data?.host && data.host.trim().length > 0);

  const resolvedHost = useMemo(() => {
    return resolvePrometheusUrl(data?.host || undefined);
  }, [data?.host]);

  if (loading) {
    return (
      <Paper p="md" withBorder radius="md">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="md" withBorder radius="md">
        <Stack align="center" p="xl" gap="sm">
          <ThemeIcon color="red" size="lg" variant="light">
            <IconAlertCircle />
          </ThemeIcon>
          <Text c="red" ta="center">{error}</Text>
          <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => loadData(true)} loading={refreshing}>
            Retry
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon variant="light" color={hasHost ? 'teal' : 'yellow'}>
              <IconServer size={18} />
            </ThemeIcon>
            <div>
              <Title order={4}>Metrics Configuration</Title>
              <Text size="sm" c="dimmed">
                Prometheus connectivity and dependencies
              </Text>
            </div>
          </Group>
          <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => loadData(true)} loading={refreshing}>
            Refresh
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Configured Host</Text>
              <Badge color={hasHost ? 'green' : 'yellow'} variant="light">
                {hasHost ? 'Configured' : 'Default'}
              </Badge>
            </Group>
            <Code block>{data?.host || 'Not provided by API'}</Code>
            <Text size="xs" c="dimmed" mt="xs">
              API supplied target host value.
            </Text>
          </Paper>

          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Resolved Endpoint</Text>
              <Badge color="blue" variant="light">Active</Badge>
            </Group>
            <Code block>{resolvedHost}</Code>
            <Text size="xs" c="dimmed" mt="xs">
              Final endpoint after fallback resolution rules.
            </Text>
          </Paper>
        </SimpleGrid>
      </Paper>

      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon variant="light" color={dependencyContainers.length > 0 ? 'teal' : 'yellow'}>
              {dependencyContainers.length > 0 ? <IconCheck size={18} /> : <IconTopologyStar3 size={18} />}
            </ThemeIcon>
            <Title order={4}>Metrics Dependencies</Title>
          </Group>
          <Badge variant="light" color={dependencyContainers.length > 0 ? 'teal' : 'yellow'}>
            {dependencyContainers.length} Containers
          </Badge>
        </Group>

        {dependencyContainers.length > 0 ? (
          <Group gap="xs">
            {dependencyContainers.map((container) => (
              <Badge key={container} variant="outline" color="blue" size="lg">
                {container}
              </Badge>
            ))}
          </Group>
        ) : (
          <Alert color="yellow" icon={<IconAlertCircle size={16} />} title="No metric dependencies configured">
            The API did not return dependency containers. Metrics collection may be incomplete.
          </Alert>
        )}
      </Paper>
    </Stack>
  );
}
