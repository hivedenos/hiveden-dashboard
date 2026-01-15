"use client";

import { TextInput, Button, Group, Stack, Text, Popover } from "@mantine/core";
import { useState } from "react";

interface CronHelperProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const isValidCron = (cron: string) => {
  if (!cron) return false;
  const parts = cron.trim().split(/\s+/);
  return parts.length === 5;
};

export function CronHelper({ value, onChange, error }: CronHelperProps) {
  const [opened, setOpened] = useState(false);

  const presets = [
    { label: "Daily (@midnight)", value: "0 0 * * *" },
    { label: "Weekly (Sun @midnight)", value: "0 0 * * 0" },
    { label: "Monthly (1st @midnight)", value: "0 0 1 * *" },
  ];

  return (
    <Stack gap="xs">
      <TextInput
        label="Schedule (Cron)"
        placeholder="e.g. 0 0 * * *"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        error={error}
        description="Format: Minute Hour Day Month Weekday"
      />
      <Group>
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant="default"
            size="xs"
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </Group>
    </Stack>
  );
}
