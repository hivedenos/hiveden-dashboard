import { listBackups, listBackupSchedules } from "@/actions/backups";
import { BackupList } from "@/components/Backups/BackupList";
import { Button, Group, Title } from "@mantine/core";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const [backups, schedules] = await Promise.all([listBackups(), listBackupSchedules()]);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Backups</Title>
        <Button component={Link} href="/backups/new">
          Create Backup
        </Button>
      </Group>
      <BackupList schedules={schedules} backups={backups} />
    </div>
  );
}
