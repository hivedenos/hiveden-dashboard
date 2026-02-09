'use client';

import { Container, Title, Group, Collapse, Button, Menu, ActionIcon, rem, Paper, Text, Badge, SimpleGrid, ThemeIcon } from '@mantine/core';
import { DockerList } from './DockerList';
import { ContainerActions } from './ContainerActions';
import { useState } from 'react';
import type { Container as DockerContainer } from '@/lib/client';
import Link from 'next/link';
import { IconPlus, IconChevronDown, IconFileImport, IconBrandDocker, IconPlayerPlay, IconPlayerStop, IconShieldCheck } from '@tabler/icons-react';

export function DockerPageContent({ containers }: { containers: DockerContainer[] }) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const runningCount = containers.filter((container) => (container.State || "").toLowerCase() === "running").length;
  const stoppedCount = containers.length - runningCount;
  const managedCount = containers.filter((container) => container.Labels?.["managed-by"] === "hiveden").length;

  // Get first selected container's state for bulk actions
  const firstSelectedContainer = containers.find(c => selectedRows.has(c.Id));
  const selectedContainerState = firstSelectedContainer?.State || '';

  return (
    <Container fluid>
      <Paper withBorder radius="md" p="md" mb="md" style={{ background: "linear-gradient(160deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 45%, transparent 100%)" }}>
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconBrandDocker size={18} />
            </ThemeIcon>
            <div>
              <Title order={2}>Docker Containers</Title>
              <Text size="sm" c="dimmed">
                Manage lifecycle, observe health, and track live usage for container workloads.
              </Text>
            </div>
          </Group>
          <Group>
              <Collapse in={selectedRows.size > 0} transitionDuration={300} transitionTimingFunction="ease">
              <ContainerActions 
                  containerId={Array.from(selectedRows).join(',')} 
                  containerState={selectedContainerState}
                  size="big"
              />
              </Collapse>
              <Group gap={0}>
                <Button 
                  component={Link} 
                  href="/docker/containers/new" 
                  leftSection={<IconPlus size={16} />}
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                >
                    Add Container
                </Button>
                <Menu transitionProps={{ transition: 'pop' }} position="bottom-end" withinPortal>
                  <Menu.Target>
                    <ActionIcon
                      variant="filled"
                      size={36}
                      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: '1px solid rgba(255, 255, 255, 0.2)' }}
                      aria-label="More options"
                    >
                      <IconChevronDown style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      component={Link}
                      href="/docker/containers/new/import-compose"
                      leftSection={<IconFileImport style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                    >
                      Import from Docker Compose
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Total</Text>
            <Text fw={700} size="xl">{containers.length}</Text>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed" tt="uppercase">Running</Text>
              <ThemeIcon size="sm" variant="light" color="green"><IconPlayerPlay size={12} /></ThemeIcon>
            </Group>
            <Text fw={700} size="xl">{runningCount}</Text>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed" tt="uppercase">Stopped</Text>
              <ThemeIcon size="sm" variant="light" color="gray"><IconPlayerStop size={12} /></ThemeIcon>
            </Group>
            <Text fw={700} size="xl">{stoppedCount}</Text>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed" tt="uppercase">Managed</Text>
              <ThemeIcon size="sm" variant="light" color="blue"><IconShieldCheck size={12} /></ThemeIcon>
            </Group>
            <Group gap={6}>
              <Text fw={700} size="xl">{managedCount}</Text>
              <Badge variant="light" color="blue">{containers.length > 0 ? `${Math.round((managedCount / containers.length) * 100)}%` : "0%"}</Badge>
            </Group>
          </Paper>
        </SimpleGrid>
      </Paper>

      <DockerList 
        containers={containers} 
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
      />
    </Container>
  );
}
