"use client";

import { createBackup, deleteBackup, deleteBackupSchedule } from "@/actions/backups";
import { Backup } from "@/lib/client/models/Backup";
import { BackupSchedule } from "@/lib/client/models/BackupSchedule";
import { formatBytes } from "@/lib/format";
import { notifications } from "@mantine/notifications";
import { ActionIcon, Alert, Badge, Box, Button, Card, Group, Paper, ScrollArea, SimpleGrid, Stack, Table, Text, ThemeIcon } from "@mantine/core";
import { IconClockHour4, IconEdit, IconArchive, IconPlayerPlay, IconPlus, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo } from "react";

interface BackupListProps {
  schedules: BackupSchedule[];
  backups: Backup[];
}

export function BackupList({ schedules, backups }: BackupListProps) {
  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const latestBackupDate = useMemo(() => {
    if (backups.length === 0) return null;
    const timestamps = backups.map((backup) => new Date(backup.timestamp).getTime()).filter((value) => !Number.isNaN(value));
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps)).toLocaleString();
  }, [backups]);

  const totalBackupSize = useMemo(() => backups.reduce((acc, backup) => acc + backup.size, 0), [backups]);

  const handleRunNow = async (schedule: BackupSchedule) => {
    try {
      await createBackup({ type: schedule.type, target: schedule.target });
      notifications.show({ title: "Success", message: "Backup started", color: "green" });
    } catch (error: unknown) {
      notifications.show({ title: "Error", message: getErrorMessage(error, "Failed to start backup"), color: "red" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteBackupSchedule(id);
      notifications.show({ title: "Success", message: "Schedule deleted", color: "green" });
    } catch (error: unknown) {
      notifications.show({ title: "Error", message: getErrorMessage(error, "Failed to delete schedule"), color: "red" });
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup ${filename}?`)) return;
    try {
      await deleteBackup(filename);
      notifications.show({ title: "Success", message: "Backup deleted", color: "green" });
    } catch (error: unknown) {
      notifications.show({ title: "Error", message: getErrorMessage(error, "Failed to delete backup"), color: "red" });
    }
  };

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Schedules
            </Text>
            <ThemeIcon size="sm" variant="light" color="blue">
              <IconClockHour4 size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt={4}>
            {schedules.length}
          </Text>
          <Text size="xs" c="dimmed">
            Active backup jobs
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Backups
            </Text>
            <ThemeIcon size="sm" variant="light" color="teal">
              <IconArchive size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt={4}>
            {backups.length}
          </Text>
          <Text size="xs" c="dimmed">
            Stored snapshots
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Total Size
            </Text>
            <ThemeIcon size="sm" variant="light" color="grape">
              <IconArchive size={14} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} mt={4}>
            {formatBytes(totalBackupSize)}
          </Text>
          <Text size="xs" c="dimmed">
            Across all backups
          </Text>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Latest Run
            </Text>
            <ThemeIcon size="sm" variant="light" color="orange">
              <IconClockHour4 size={14} />
            </ThemeIcon>
          </Group>
          <Text size="sm" fw={700} mt={8}>
            {latestBackupDate || "N/A"}
          </Text>
          <Text size="xs" c="dimmed">
            Most recent backup timestamp
          </Text>
        </Paper>
      </SimpleGrid>

      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Box>
            <Text fw={700} size="lg">
              Scheduled Backups
            </Text>
            <Text size="sm" c="dimmed">
              Configure recurring jobs and trigger immediate runs.
            </Text>
          </Box>
          <Badge color="blue" variant="light">
            {schedules.length} schedules
          </Badge>
        </Group>
        {schedules.length === 0 ? (
          <Alert color="blue" variant="light" title="No schedules yet" icon={<IconClockHour4 size={16} />}>
            Create your first backup schedule to automate regular snapshots.
          </Alert>
        ) : (
          <ScrollArea>
            <Table highlightOnHover withTableBorder withColumnBorders striped>
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
                      <Badge color={schedule.type === "database" ? "blue" : "green"} variant="light">
                        {schedule.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td fw={600}>{schedule.target}</Table.Td>
                    <Table.Td>
                      <Text ff="monospace" size="sm">
                        {schedule.cron}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon component={Link} href={`/backups/${schedule.id}/edit`} variant="light" color="blue">
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => schedule.id && handleDelete(schedule.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="green" onClick={() => handleRunNow(schedule)}>
                          <IconPlayerPlay size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Box>
            <Text fw={700} size="lg">
              Recent Backups
            </Text>
            <Text size="sm" c="dimmed">
              Review generated artifacts and remove outdated files.
            </Text>
          </Box>
          <Badge color="teal" variant="light">
            {backups.length} artifacts
          </Badge>
        </Group>
        {backups.length === 0 ? (
          <Alert color="teal" variant="light" title="No backups found" icon={<IconArchive size={16} />}>
            Run a schedule or start a manual backup to populate history.
          </Alert>
        ) : (
          <ScrollArea>
            <Table highlightOnHover withTableBorder withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Target</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>File</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {backups.map((backup) => (
                  <Table.Tr key={backup.filename}>
                    <Table.Td>
                      <Badge color={backup.type === "database" ? "blue" : "green"} variant="light">
                        {backup.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td fw={600}>{backup.target}</Table.Td>
                    <Table.Td>{new Date(backup.timestamp).toLocaleString()}</Table.Td>
                    <Table.Td>{formatBytes(backup.size)}</Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace">
                        {backup.filename}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon variant="light" color="red" onClick={() => handleDeleteBackup(backup.filename)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      <Group justify="flex-end">
        <Button component={Link} href="/backups/new" leftSection={<IconPlus size={16} />}>
          Create Backup
        </Button>
      </Group>
    </Stack>
  );
}
