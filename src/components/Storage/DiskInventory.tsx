'use client';

import type { Disk } from '@/lib/client';
import { formatBytes } from '@/lib/format';
import { Badge, Card, Code, Divider, Group, Paper, Progress, SimpleGrid, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconDatabase, IconDeviceFloppy, IconServer } from '@tabler/icons-react';

interface DiskInventoryProps {
  disks: Disk[];
  onDiskClick: (disk: Disk) => void;
}

export function DiskInventory({ disks, onDiskClick }: DiskInventoryProps) {
  const groupedDisks = disks.reduce((acc, disk) => {
    const key = disk.raid_group || 'ungrouped';
    if (!acc[key]) acc[key] = [];
    acc[key].push(disk);
    return acc;
  }, {} as Record<string, Disk[]>);

  const raidGroups = Object.keys(groupedDisks).filter((key) => key !== 'ungrouped');
  const ungroupedDisks = groupedDisks.ungrouped || [];

  if (disks.length === 0) {
    return (
      <Paper withBorder radius="md" p="lg">
        <Stack align="center" gap="xs">
          <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
            <IconDatabase size={20} />
          </ThemeIcon>
          <Text fw={600}>No storage devices detected</Text>
          <Text size="sm" c="dimmed" ta="center">
            Check hardware connectivity and refresh the page to load disk inventory.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="xl">
      {raidGroups.map((groupKey) => {
        const groupDisks = groupedDisks[groupKey];
        const raidLevel = groupDisks[0].raid_level || 'RAID Array';
        const totalRaidSize = groupDisks.reduce((acc, disk) => acc + (disk.size || 0), 0);

        return (
          <Paper key={groupKey} withBorder p="md" radius="md">
            <UnstyledButton
              onClick={() => onDiskClick(groupDisks[0])}
              style={{
                width: '100%',
                borderRadius: 'var(--mantine-radius-sm)',
                padding: '6px',
                transition: 'background-color 160ms ease',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group>
                  <ThemeIcon size="lg" variant="light" color="indigo">
                    <IconServer size={20} />
                  </ThemeIcon>
                  <div>
                    <Group gap={8}>
                      <Text fw={700}>
                        {raidLevel.toUpperCase()} ({groupKey})
                      </Text>
                      <Badge variant="light" color="indigo">
                        {groupDisks.length} members
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      Total raw size: {formatBytes(totalRaidSize)}
                    </Text>
                  </div>
                </Group>
                <Group gap={6}>
                  <Text size="xs" c="dimmed">
                    Open
                  </Text>
                  <ThemeIcon size="sm" variant="light" color="gray">
                    <IconChevronRight size={14} />
                  </ThemeIcon>
                </Group>
              </Group>
            </UnstyledButton>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="md">
              {groupDisks.map((disk) => (
                <DiskCard key={disk.path} disk={disk} onClick={() => onDiskClick(disk)} />
              ))}
            </SimpleGrid>
          </Paper>
        );
      })}

      {ungroupedDisks.length > 0 && (
        <>
          {raidGroups.length > 0 && <Divider label="Available / Independent Disks" labelPosition="center" />}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {ungroupedDisks.map((disk) => (
              <DiskCard key={disk.path} disk={disk} onClick={() => onDiskClick(disk)} />
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}

function DiskCard({ disk, onClick }: { disk: Disk; onClick: () => void }) {
  const totalSize = disk.size;
  const usedSize = (disk.partitions || []).reduce((acc, part) => acc + part.size, 0);
  const usedPercentage = totalSize > 0 ? (usedSize / totalSize) * 100 : 0;
  const usageColor = usedPercentage > 90 ? 'red' : usedPercentage > 70 ? 'orange' : 'blue';

  const Icon = disk.rotational ? IconDatabase : IconDeviceFloppy;

  return (
    <UnstyledButton onClick={onClick} style={{ width: '100%' }}>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{
          height: '100%',
          transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
        }}
      >
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon color="blue" variant="light" radius="xl">
                <Icon size={16} />
              </ThemeIcon>
              <div>
                <Text fw={600}>{disk.name}</Text>
                <Text size="xs" c="dimmed">
                  {disk.model || 'Unknown model'}
                </Text>
              </div>
            </Group>
            <Group gap="xs">
              {disk.is_system && <Badge color="red">OS Drive</Badge>}
              {disk.available && <Badge color="green">Unused</Badge>}
              {!disk.available && !disk.is_system && <Badge color="gray">In Use</Badge>}
              {disk.raid_level && (
                <Badge color="indigo" variant="outline">
                  {disk.raid_level}
                </Badge>
              )}
            </Group>
          </Group>
        </Card.Section>

        <Stack mt="md" gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Size
            </Text>
            <Text size="sm" fw={500}>
              {formatBytes(disk.size)}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Allocated
            </Text>
            <Text size="sm" fw={500}>
              {formatBytes(usedSize)}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Path
            </Text>
            <Code>{disk.path}</Code>
          </Group>

          <Stack gap={4} mt="sm">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Allocated Space
              </Text>
              <Text size="xs" c="dimmed">
                {usedPercentage.toFixed(1)}%
              </Text>
            </Group>
            <Progress value={usedPercentage} color={usageColor} size="sm" />
          </Stack>

          {(disk.partitions?.length || 0) > 0 && (
            <Stack gap={4} mt="xs">
              <Text size="xs" c="dimmed" fw={600}>
                Partitions
              </Text>
              {(disk.partitions || []).map((part) => (
                <Group key={part.path} justify="space-between">
                  <Text size="xs">{part.name}</Text>
                  <Text size="xs" c="dimmed">
                    {formatBytes(part.size)}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>
    </UnstyledButton>
  );
}
