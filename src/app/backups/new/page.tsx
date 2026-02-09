"use client";

import { Alert, Badge, Box, Group, Paper, Text, ThemeIcon, Title } from "@mantine/core";
import { BackupForm } from "@/components/Backups/BackupForm";
import { createBackupSchedule } from "@/actions/backups";
import { listDatabases } from "@/actions/database";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { BackupSchedule } from "@/lib/client/models/BackupSchedule";
import { IconDatabase, IconInfoCircle } from "@tabler/icons-react";

export default function CreateBackupPage() {
  const router = useRouter();
  const [databases, setDatabases] = useState<string[]>([]);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await listDatabases();
        if (response.data) {
          setDatabases(response.data.map((db) => db.name));
        }
      } catch (error) {
        console.error("Failed to fetch databases", error);
      }
    };
    fetchDatabases();
  }, []);

  const handleSubmit = async (values: BackupSchedule) => {
    try {
      await createBackupSchedule(values);
      notifications.show({
        title: "Success",
        message: "Backup schedule created",
        color: "green",
      });
      router.push("/backups");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create backup schedule";
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
    }
  };

  return (
    <Box>
      <Paper withBorder radius="lg" p="lg" mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <Box>
            <Group gap="xs" mb={6}>
              <ThemeIcon variant="light" color="teal" radius="xl">
                <IconDatabase size={16} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                New Backup Schedule
              </Text>
            </Group>
            <Title order={2}>Create Backup</Title>
            <Text c="dimmed" mt={6}>
              Configure backup target and cron schedule. Database targets are suggested from discovered services.
            </Text>
          </Box>
          <Badge size="lg" color="teal" variant="light">
            Guided Setup
          </Badge>
        </Group>
      </Paper>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" radius="md" mb="md">
        Choose a frequent schedule for critical databases and verify cron expressions before saving.
      </Alert>
      <BackupForm onSubmit={handleSubmit} databases={databases} />
    </Box>
  );
}
