"use client";

import { Button, Select, TextInput, Stack, Group, Paper } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CronHelper, isValidCron } from "./CronHelper";
import { BackupSchedule } from "@/lib/client/models/BackupSchedule";

interface BackupFormProps {
  initialData?: BackupSchedule;
  onSubmit: (values: any) => void;
  isEditing?: boolean;
}

export function BackupForm({ initialData, onSubmit, isEditing }: BackupFormProps) {
  const form = useForm({
    initialValues: {
      type: initialData?.type || "database",
      target: initialData?.target || "",
      cron: initialData?.cron || "",
    },

    validate: {
      target: (value) => (value.length < 1 ? "Target is required" : null),
      cron: (value) => (isValidCron(value) ? null : "Invalid cron expression"),
    },
  });

  return (
    <Paper withBorder p="lg" radius="md">
      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <Stack gap="md">
          <Select
            label="Backup Type"
            data={[
              { value: "database", label: "Database" },
              { value: "application", label: "Application Directory" },
            ]}
            {...form.getInputProps("type")}
            disabled={isEditing}
          />

          <TextInput
            label="Target"
            placeholder="e.g. postgres, /opt/app"
            {...form.getInputProps("target")}
            disabled={isEditing}
          />

          <CronHelper
            value={form.values.cron}
            onChange={(val) => form.setFieldValue("cron", val)}
            error={form.errors.cron as string}
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit">Save Backup</Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
