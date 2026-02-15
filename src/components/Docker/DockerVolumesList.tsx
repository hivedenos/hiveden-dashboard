"use client";

import type { DockerVolume } from "@/lib/client";
import { Badge, Card, Group, Paper, Table, Text } from "@mantine/core";
import { DockerVolumeActions } from "./DockerVolumeActions";

interface DockerVolumesListProps {
  volumes: DockerVolume[];
}

export function DockerVolumesList({ volumes }: DockerVolumesListProps) {
  return (
    <Card withBorder shadow="sm" radius="md">
      <Table highlightOnHover withTableBorder horizontalSpacing="md" verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Driver</Table.Th>
            <Table.Th>Scope</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Mountpoint</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {volumes.length > 0 ? (
            volumes.map((volume) => (
              <Table.Tr key={volume.name}>
                <Table.Td>
                  <Text fw={600} size="sm">{volume.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="blue">{volume.driver}</Badge>
                </Table.Td>
                <Table.Td>{volume.scope}</Table.Td>
                <Table.Td>{new Date(volume.created_at).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={1}>{volume.mountpoint}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={8}>
                    <DockerVolumeActions volumeName={volume.name} />
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Paper p="md" bg="transparent">
                  <Text ta="center" c="dimmed">No Docker volumes found.</Text>
                </Paper>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
