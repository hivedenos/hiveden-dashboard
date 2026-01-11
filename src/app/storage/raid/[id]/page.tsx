import { listStorageDevices } from "@/actions/storage";
import { BackButton } from "@/components/Storage/BackButton";
import { RaidManagement } from "@/components/Storage/RaidManagement";
import type { Disk } from "@/lib/client";
import { Container, Group } from "@mantine/core";

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
        <div>RAID Group not found</div>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group mb="lg">
        <BackButton />
      </Group>
      <RaidManagement raidId={id} allDisks={disks} />
    </Container>
  );
}
