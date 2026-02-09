"use client";

import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";

export function CreateBackupButton() {
  return (
    <Button component={Link} href="/backups/new" leftSection={<IconPlus size={16} />}>
      Create Backup
    </Button>
  );
}
