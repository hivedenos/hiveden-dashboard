"use client";

import { Button } from "@mantine/core";
import Link from "next/link";

export function CreateBackupButton() {
  return (
    <Button component={Link} href="/backups/new">
      Create Backup
    </Button>
  );
}
