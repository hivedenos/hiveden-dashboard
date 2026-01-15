import { Title, Text, Button, Group } from "@mantine/core";
import Link from "next/link";

export default function BackupsPage() {
  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Backups</Title>
        <Button component={Link} href="/backups/new">
          Create Backup
        </Button>
      </Group>
      <Text>Backup list will be here.</Text>
    </div>
  );
}
