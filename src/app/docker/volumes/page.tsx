import { listDockerVolumes } from "@/actions/docker";
import { DockerVolumesList } from "@/components/Docker/DockerVolumesList";
import type { DockerVolume } from "@/lib/client";
import { Container, Group, Paper, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCylinder } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default async function DockerVolumesPage() {
  const response = await listDockerVolumes();
  const volumes = (response.data || []) as DockerVolume[];

  return (
    <Container fluid>
      <Paper
        withBorder
        radius="md"
        p="md"
        mb="md"
        style={{ background: "linear-gradient(160deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 45%, transparent 100%)" }}
      >
        <Group>
          <ThemeIcon size="lg" variant="light" color="green">
            <IconCylinder size={18} />
          </ThemeIcon>
          <div>
            <Title order={2}>Docker Volumes</Title>
            <Text size="sm" c="dimmed">
              Browse persistent volumes and remove obsolete storage safely.
            </Text>
          </div>
        </Group>
      </Paper>

      <DockerVolumesList volumes={volumes} />
    </Container>
  );
}
