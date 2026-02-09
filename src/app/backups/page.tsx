import { listBackups, listBackupSchedules } from "@/actions/backups";
import { BackupList } from "@/components/Backups/BackupList";
import { CreateBackupButton } from "@/components/Backups/CreateBackupButton";
import { Badge, Box, Group, Paper, Text, ThemeIcon, Title } from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const [backups, schedules] = await Promise.all([listBackups(), listBackupSchedules()]);

  return (
    <Box>
      <Paper withBorder radius="lg" p="lg" mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <Box>
            <Group gap="xs" mb={6}>
              <ThemeIcon variant="light" color="blue" radius="xl">
                <IconShieldCheck size={16} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                Data Protection Center
              </Text>
            </Group>
            <Title order={2}>Backups</Title>
            <Text c="dimmed" mt={6}>
              Schedule recurring backups, run on-demand snapshots, and monitor recent backup artifacts.
            </Text>
          </Box>
          <Badge size="lg" color="blue" variant="light">
            {schedules.length} schedules
          </Badge>
        </Group>
      </Paper>
      <Group justify="flex-end" mb="md">
        <CreateBackupButton />
      </Group>
      <BackupList schedules={schedules} backups={backups} />
    </Box>
  );
}
