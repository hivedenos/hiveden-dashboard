import { listBackups, listBackupSchedules } from "@/actions/backups";
import { BackupList } from "@/components/Backups/BackupList";
import { CreateBackupButton } from "@/components/Backups/CreateBackupButton";
import { Group, Title } from "@mantine/core";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const [backups, schedules] = await Promise.all([listBackups(), listBackupSchedules()]);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Backups</Title>
        <CreateBackupButton />
      </Group>
      <BackupList schedules={schedules} backups={backups} />
    </div>
  );
}