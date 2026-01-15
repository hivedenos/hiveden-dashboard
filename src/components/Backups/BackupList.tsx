"use client";

import { Table, Badge, ActionIcon, Group, Text, Card, Stack } from "@mantine/core";
import { IconEdit, IconTrash, IconPlayerPlay } from "@tabler/icons-react";
import { formatBytes } from "@/lib/format";
import Link from "next/link";
import { Backup } from "@/lib/client/models/Backup";
import { BackupSchedule } from "@/lib/client/models/BackupSchedule";
import { createBackup, deleteBackupSchedule } from "@/actions/backups";
import { notifications } from "@mantine/notifications";

interface BackupListProps {
  schedules: BackupSchedule[];
  backups: Backup[];
}

export function BackupList({ schedules, backups }: BackupListProps) {
  const handleRunNow = async (schedule: BackupSchedule) => {
    try {
      await createBackup({ type: schedule.type, target: schedule.target });
      notifications.show({ title: 'Success', message: 'Backup started', color: 'green' });
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message || 'Failed to start backup', color: 'red' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteBackupSchedule(id);
      notifications.show({ title: 'Success', message: 'Schedule deleted', color: 'green' });
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message || 'Failed to delete schedule', color: 'red' });
    }
  };

  return (
    <Stack gap="xl">
      <Card withBorder padding="lg" radius="md">
        <Text fw={700} size="lg" mb="md">Scheduled Backups</Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Target</Table.Th>
              <Table.Th>Schedule (Cron)</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {schedules.map((schedule) => (
              <Table.Tr key={schedule.id || schedule.target}>
                <Table.Td>
                  <Badge color={schedule.type === 'database' ? 'blue' : 'green'}>
                    {schedule.type}
                  </Badge>
                </Table.Td>
                <Table.Td>{schedule.target}</Table.Td>
                <Table.Td>{schedule.cron}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon component={Link} href={`/backups/${schedule.id}/edit`} variant="subtle" color="blue">
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => schedule.id && handleDelete(schedule.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="green" onClick={() => handleRunNow(schedule)}>
                      <IconPlayerPlay size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {schedules.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} align="center">No schedules found</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Text fw={700} size="lg" mb="md">Recent Backups</Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Target</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th>File</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {backups.map((backup) => (
              <Table.Tr key={backup.filename}>
                <Table.Td>
                  <Badge color={backup.type === 'database' ? 'blue' : 'green'}>
                    {backup.type}
                  </Badge>
                </Table.Td>
                <Table.Td>{backup.target}</Table.Td>
                <Table.Td>{new Date(backup.timestamp).toLocaleString()}</Table.Td>
                <Table.Td>{formatBytes(backup.size)}</Table.Td>
                <Table.Td>{backup.filename}</Table.Td>
              </Table.Tr>
            ))}
            {backups.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5} align="center">No backups found</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}