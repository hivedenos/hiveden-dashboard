'use client';

import { Badge, Box, Card, Container, Group, Paper, SimpleGrid, Tabs, Text, ThemeIcon, Title, rem } from '@mantine/core';
import { IconChartLine, IconDatabase, IconFolder, IconServer, IconSettings, IconWorld } from '@tabler/icons-react';
import { DomainSettings } from '@/components/System/DomainSettings';
import { LocationSettings } from '@/components/System/LocationSettings';
import { DNSSettings } from '@/components/System/DNSSettings';
import { DatabaseList } from '@/components/System/DatabaseList';
import { MetricsSettings } from '@/components/System/MetricsSettings';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SystemPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam || 'domain';

  const handleTabChange = (value: string | null) => {
    if (value) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`?${params.toString()}`);
    }
  };

  const iconStyle = { width: rem(12), height: rem(12) };

  return (
    <Container fluid>
      <Paper withBorder radius="lg" p="lg" mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <Box>
            <Group gap="xs" mb={6}>
              <ThemeIcon variant="light" color="blue" radius="xl">
                <IconSettings size={16} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                Platform Control Plane
              </Text>
            </Group>
            <Title order={2}>System Configuration</Title>
            <Text c="dimmed" mt={6}>
              Manage domain, DNS, database, storage locations, and metrics endpoints from a unified settings workspace.
            </Text>
          </Box>
          <Badge size="lg" color="blue" variant="light">
            5 Config Areas
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} mt="lg">
          <Card withBorder radius="md" p="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="blue">
                <IconWorld size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                Domain
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={6}>
              Public base domain settings
            </Text>
          </Card>

          <Card withBorder radius="md" p="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="teal">
                <IconServer size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                DNS
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={6}>
              Resolver and network DNS config
            </Text>
          </Card>

          <Card withBorder radius="md" p="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="grape">
                <IconDatabase size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                Database
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={6}>
              Service databases and defaults
            </Text>
          </Card>

          <Card withBorder radius="md" p="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="orange">
                <IconFolder size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                Storage
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={6}>
              Logical storage location mapping
            </Text>
          </Card>

          <Card withBorder radius="md" p="sm">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="indigo">
                <IconChartLine size={14} />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                Metrics
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={6}>
              Prometheus and telemetry endpoint
            </Text>
          </Card>
        </SimpleGrid>
      </Paper>

      <Paper withBorder radius="lg" p="md">
        <Tabs value={activeTab} onChange={handleTabChange} variant="pills" radius="xl">
          <Tabs.List mb="md">
          <Tabs.Tab value="domain" leftSection={<IconWorld style={iconStyle} />}>
            Domain
          </Tabs.Tab>
          <Tabs.Tab value="dns" leftSection={<IconServer style={iconStyle} />}>
            DNS
          </Tabs.Tab>
          <Tabs.Tab value="database" leftSection={<IconDatabase style={iconStyle} />}>
            Database
          </Tabs.Tab>
          <Tabs.Tab value="locations" leftSection={<IconFolder style={iconStyle} />}>
            Storage Locations
          </Tabs.Tab>
          <Tabs.Tab value="metrics" leftSection={<IconChartLine style={iconStyle} />}>
            Metrics
          </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="domain">
            <DomainSettings />
          </Tabs.Panel>

          <Tabs.Panel value="dns">
            <DNSSettings />
          </Tabs.Panel>

          <Tabs.Panel value="database">
            <DatabaseList />
          </Tabs.Panel>

          <Tabs.Panel value="locations">
            <LocationSettings />
          </Tabs.Panel>

          <Tabs.Panel value="metrics">
            <MetricsSettings />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}

export default function SystemPage() {
  return (
    <Suspense fallback={<Text c="dimmed">Loading system configuration...</Text>}>
      <SystemPageContent />
    </Suspense>
  );
}
