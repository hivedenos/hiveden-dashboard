"use client";

import { Title } from "@mantine/core";
import { BackupForm } from "@/components/Backups/BackupForm";
import { createBackupSchedule } from "@/actions/backups";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

export default function CreateBackupPage() {
  const router = useRouter();

  const handleSubmit = async (values: any) => {
    try {
      await createBackupSchedule(values);
      notifications.show({
        title: "Success",
        message: "Backup schedule created",
        color: "green",
      });
      router.push("/backups");
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create backup schedule",
        color: "red",
      });
    }
  };

  return (
    <div>
      <Title order={2} mb="lg">Create Backup</Title>
      <BackupForm onSubmit={handleSubmit} />
    </div>
  );
}