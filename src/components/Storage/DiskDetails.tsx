'use client';

import type { DiskDetail } from '@/lib/client';
import { Card, Group, Text, Badge, Stack, SimpleGrid, Table, ThemeIcon, Collapse, Button, Box } from '@mantine/core';
import { IconDeviceDesktop, IconThermometer, IconClock, IconBolt, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { formatBytes } from '@/lib/format';

interface SmartAttribute {
  id: number;
  name: string;
  value: number;
  worst: number;
  thresh: number;
  raw: { value: number; string: string };
}

interface DiskDetailsProps {
  disk: DiskDetail;
}

export function DiskDetails({ disk }: DiskDetailsProps) {
  const [opened, { toggle }] = useDisclosure(false);

  const getHealthColor = (healthy: boolean) => healthy ? 'green' : 'red';
  const getTempColor = (temp?: number) => {
    if (temp === undefined) return 'gray';
    if (temp < 40) return 'green';
    if (temp < 50) return 'yellow';
    return 'red';
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="md">
            <ThemeIcon size={40} radius="md" variant="light" color="blue">
               <IconDeviceDesktop size={24} />
            </ThemeIcon>
            <div>
              <Text size="lg" fw={700}>{disk.path}</Text>
              <Text size="sm" c="dimmed">{disk.model} {disk.serial ? `(${disk.serial})` : ''}</Text>
            </div>
          </Group>
          <Group>
             <Badge size="lg" color={disk.smart ? getHealthColor(disk.smart.healthy) : 'gray'}>
                {disk.smart ? (disk.smart.healthy ? 'HEALTHY' : 'FAILED') : 'UNKNOWN'}
             </Badge>
             <Badge variant="outline">{disk.rotational ? 'HDD' : 'SSD'}</Badge>
             {disk.bus && <Badge variant="outline">{disk.bus}</Badge>}
             {disk.raid_level && <Badge color="violet">{disk.raid_level}</Badge>}
          </Group>
        </Group>

        {/* RAID Info */}
        {disk.raid_group && (
            <Card withBorder padding="sm" radius="sm" bg="var(--mantine-color-gray-0)">
                <Group>
                    <Text fw={600}>RAID Group:</Text>
                    <Text>{disk.raid_group}</Text>
                </Group>
            </Card>
        )}

        {/* Key Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="lg">
           <Card withBorder padding="sm" radius="sm">
              <Group gap="xs">
                 <IconThermometer size={20} color={disk.smart?.temperature ? 'var(--mantine-color-text)' : 'gray'} />
                 <Text size="sm" c="dimmed">Temperature</Text>
              </Group>
              <Text fw={700} size="xl" mt="xs" c={getTempColor(disk.smart?.temperature ?? undefined)}>
                 {disk.smart?.temperature ? `${disk.smart.temperature}°C` : 'N/A'}
              </Text>
           </Card>
           <Card withBorder padding="sm" radius="sm">
              <Group gap="xs">
                 <IconClock size={20} />
                 <Text size="sm" c="dimmed">Power On Hours</Text>
              </Group>
              <Text fw={700} size="xl" mt="xs">
                 {disk.smart?.power_on_hours ? `${disk.smart.power_on_hours}h` : 'N/A'}
              </Text>
           </Card>
           <Card withBorder padding="sm" radius="sm">
              <Group gap="xs">
                 <IconBolt size={20} />
                 <Text size="sm" c="dimmed">Power Cycles</Text>
              </Group>
              <Text fw={700} size="xl" mt="xs">
                 {disk.smart?.power_cycles || 'N/A'}
              </Text>
           </Card>
        </SimpleGrid>
      </Card>

      {/* Partitions */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} mb="md">Partitions</Text>
        {(disk.partitions?.length || 0) === 0 ? (
            <Text c="dimmed" size="sm">No partitions found.</Text>
        ) : (
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Mount Point</Table.Th>
                        <Table.Th>Size</Table.Th>
                        <Table.Th>FS Type</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {(disk.partitions || []).map(part => (
                        <Table.Tr key={part.path}>
                            <Table.Td>{part.name}</Table.Td>
                            <Table.Td>{part.mountpoint || '-'}</Table.Td>
                            <Table.Td>{formatBytes(part.size)}</Table.Td>
                            <Table.Td>{part.fstype || '-'}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        )}
      </Card>

      {/* SMART Attributes */}
      {disk.smart ? (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md" onClick={toggle} style={{ cursor: 'pointer' }}>
                <Text fw={600}>S.M.A.R.T. Attributes</Text>
                <Button variant="subtle" size="sm" rightSection={opened ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}>
                    {opened ? 'Hide' : 'Show'} Details
                </Button>
            </Group>
            
            <Collapse in={opened}>
                <Box style={{ overflowX: 'auto' }}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Attribute Name</Table.Th>
                                <Table.Th>Value</Table.Th>
                                <Table.Th>Worst</Table.Th>
                                <Table.Th>Thresh</Table.Th>
                                <Table.Th>Raw</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {(disk.smart.attributes as unknown as SmartAttribute[]).map((attr) => {
                                const isCritical = attr.value <= attr.thresh && attr.thresh !== 0;
                                return (
                                    <Table.Tr key={attr.id} bg={isCritical ? 'var(--mantine-color-red-1)' : undefined}>
                                        <Table.Td>{attr.id}</Table.Td>
                                        <Table.Td>{attr.name}</Table.Td>
                                        <Table.Td c={isCritical ? 'red' : undefined}>{attr.value}</Table.Td>
                                        <Table.Td>{attr.worst}</Table.Td>
                                        <Table.Td>{attr.thresh}</Table.Td>
                                        <Table.Td>{attr.raw.string}</Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Box>
            </Collapse>
          </Card>
      ) : (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text c="dimmed">S.M.A.R.T. health data is unavailable for this device.</Text>
          </Card>
      )}
    </Stack>
  );
}
