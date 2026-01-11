'use client';

import type { Disk } from '@/lib/client';
import { formatBytes } from '@/lib/format';
import { Card, Text, Group, Badge, Progress, SimpleGrid, Stack, ThemeIcon, Code, UnstyledButton, Divider } from '@mantine/core';
import { IconDatabase, IconDeviceFloppy, IconServer } from '@tabler/icons-react';

interface DiskInventoryProps {
  disks: Disk[];
  onDiskClick: (disk: Disk) => void;
}

export function DiskInventory({ disks, onDiskClick }: DiskInventoryProps) {
  // Helper to group disks
  const groupedDisks = disks.reduce((acc, disk) => {
    const key = disk.raid_group || 'ungrouped';
    if (!acc[key]) acc[key] = [];
    acc[key].push(disk);
    return acc;
  }, {} as Record<string, Disk[]>);

  const raidGroups = Object.keys(groupedDisks).filter(key => key !== 'ungrouped');
  const ungroupedDisks = groupedDisks['ungrouped'] || [];

  return (
    <Stack gap="xl">
      {/* Render RAID Groups */}
      {raidGroups.map((groupKey) => {
        const groupDisks = groupedDisks[groupKey];
        const raidLevel = groupDisks[0].raid_level || "RAID Array";

        return (
          <Card key={groupKey} withBorder padding="md" radius="md" bg="var(--mantine-color-gray-0)">
            <UnstyledButton
              onClick={() => onDiskClick(groupDisks[0])}
              style={{ width: "100%" }}
              mb="md"
              className="hover:bg-gray-100 dark:hover:bg-dark-6 rounded-sm p-1 transition-colors"
            >
              <Group>
                <ThemeIcon size="lg" variant="light" color="indigo">
                  <IconServer size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={700}>
                    {raidLevel.toUpperCase()} ({groupKey})
                  </Text>
                  <Text size="xs" c="dimmed">
                    {groupDisks.length} Member Disks
                  </Text>
                </div>
              </Group>
            </UnstyledButton>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {groupDisks.map((disk) => (
                <DiskCard key={disk.path} disk={disk} onClick={() => onDiskClick(disk)} />
              ))}
            </SimpleGrid>
          </Card>
        );
      })}

      {/* Render Ungrouped Disks */}
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

  const Icon = disk.rotational ? IconDatabase : IconDeviceFloppy;

  return (
    <UnstyledButton onClick={onClick} style={{ width: '100%' }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s' }} className="hover:scale-[1.01] hover:shadow-md">
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon color="blue" variant="light">
                <Icon size={16} />
              </ThemeIcon>
              <Text fw={500}>{disk.name}</Text>
            </Group>
            <Group gap="xs">
              {disk.is_system && <Badge color="red">OS Drive</Badge>}
              {disk.available && <Badge color="green">Unused</Badge>}
              {!disk.available && !disk.is_system && <Badge color="gray">In Use</Badge>}
              {disk.raid_level && <Badge color="indigo" variant="outline">{disk.raid_level}</Badge>}
            </Group>
          </Group>
        </Card.Section>

        <Stack mt="md" gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Model</Text>
            <Text size="sm" fw={500}>{disk.model || 'Unknown'}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Size</Text>
            <Text size="sm" fw={500}>{formatBytes(disk.size)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Path</Text>
            <Code>{disk.path}</Code>
          </Group>

          <Stack gap={4} mt="sm">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Allocated Space</Text>
              <Text size="xs" c="dimmed">{usedPercentage.toFixed(1)}%</Text>
            </Group>
            <Progress 
              value={usedPercentage} 
              color={usedPercentage > 90 ? 'red' : 'blue'} 
              size="sm" 
            />
          </Stack>

          {(disk.partitions?.length || 0) > 0 && (
            <Stack gap={4} mt="xs">
              <Text size="xs" c="dimmed" fw={600}>Partitions</Text>
              {(disk.partitions || []).map(part => (
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
