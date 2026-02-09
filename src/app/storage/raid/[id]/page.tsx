import { listStorageDevices } from "@/actions/storage";
import { BackButton } from "@/components/Storage/BackButton";
import { RaidManagement } from "@/components/Storage/RaidManagement";
import type { Disk } from "@/lib/client";
import { Badge, Container, Group, Paper, Text, ThemeIcon, Title } from "@mantine/core";
import { IconServer } from "@tabler/icons-react";

interface RaidPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function RaidPage({ params }: RaidPageProps) {
  const { id } = await params;
  let disks: Disk[] = [];

  try {
    const response = await listStorageDevices();
    disks = response.data || [];
  } catch (error) {
    console.error("Failed to fetch storage devices:", error);
  }

  // Ensure the RAID group exists
  const raidExists = disks.some((d) => d.raid_group === id);

  if (!raidExists) {
    return (
      <Container size="xl" py="xl">
        <Group mb="lg">
          <BackButton />
        </Group>
        <Paper withBorder radius="lg" p="lg">
          <Text fw={600}>RAID Group not found</Text>
          <Text c="dimmed" size="sm" mt={4}>
            The requested RAID identifier does not exist in current storage inventory.
          </Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group mb="lg">
        <BackButton />
      </Group>
      <Paper withBorder radius="lg" p="lg" mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <div>
            <Group gap="xs" mb={6}>
              <ThemeIcon variant="light" color="indigo" radius="xl">
                <IconServer size={16} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                RAID Array Management
              </Text>
            </Group>
            <Title order={2}>RAID Group: {id}</Title>
            <Text c="dimmed" mt={6}>
              Inspect array members and safely extend the group with available disks.
            </Text>
          </div>
          <Badge size="lg" color="indigo" variant="light">
            Live Inventory
          </Badge>
        </Group>
      </Paper>
      <RaidManagement raidId={id} allDisks={disks} />
    </Container>
  );
}
