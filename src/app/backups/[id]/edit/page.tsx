"use client";

import { Title, Loader, Alert } from "@mantine/core";
import { BackupForm } from "@/components/Backups/BackupForm";
import { listBackupSchedules, updateBackupSchedule } from "@/actions/backups";
import { useRouter, useParams } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { BackupSchedule } from "@/lib/client/models/BackupSchedule";

export default function EditBackupPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const schedules = await listBackupSchedules();
        // The API returns schedules with 'id'
        const found = schedules.find((s) => s.id === id);
        if (found) {
          setSchedule(found);
        } else {
          setError("Schedule not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch schedule");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchSchedule();
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
    if (!schedule) return;
    try {
      await updateBackupSchedule(id, values);
      notifications.show({
        title: "Success",
        message: "Backup schedule updated",
        color: "green",
      });
      router.push("/backups");
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update backup schedule",
        color: "red",
      });
    }
  };

  if (loading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;
  if (!schedule) return <Alert color="red">Schedule not found</Alert>;

  return (
    <div>
      <Title order={2} mb="lg">Edit Backup</Title>
      <BackupForm initialData={schedule} onSubmit={handleSubmit} isEditing />
    </div>
  );
}