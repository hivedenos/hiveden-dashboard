"use client";

import { Badge, Button, Group, Paper, Select, Stack, Text, Autocomplete } from "@mantine/core";
import { useForm } from "@mantine/form";
import { CronHelper, isValidCron } from "./CronHelper";
import { BackupSchedule } from "@/lib/client/models/BackupSchedule";
import { IconCalendarTime } from "@tabler/icons-react";

interface BackupFormProps {
  initialData?: BackupSchedule;
  onSubmit: (values: BackupSchedule) => void;
  isEditing?: boolean;
  databases?: string[];
}

export function BackupForm({ initialData, onSubmit, isEditing, databases = [] }: BackupFormProps) {
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

  const autocompleteData = form.values.type === "database" ? databases : [];

  return (
    <Paper withBorder p="lg" radius="lg">
      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Text fw={600} size="sm" c="dimmed">
              Backup Configuration
            </Text>
            <Badge variant="light" color="blue" leftSection={<IconCalendarTime size={12} />}>
              Cron Required
            </Badge>
          </Group>

          <Select
            label="Backup Type"
            description="Choose whether this schedule targets a database or an application path."
            data={[
              { value: "database", label: "Database" },
              { value: "application", label: "Application Directory" },
            ]}
            {...form.getInputProps("type")}
            disabled={isEditing}
          />

          <Autocomplete
            label="Target"
            description={form.values.type === "database" ? "Pick a database name or type one manually." : "Enter the directory path to back up."}
            placeholder="e.g. postgres, /opt/app"
            data={autocompleteData}
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
