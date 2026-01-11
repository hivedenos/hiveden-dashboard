import { getContainer } from "@/actions/docker";
import { Container, Title, Group, Text, Code } from "@mantine/core";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import type { Container as DockerContainer } from "@/lib/client";
import { ContainerTabs } from "@/components/Docker/ContainerTabs";
import { ContainerActions } from "@/components/Docker/ContainerActions";

export const dynamic = "force-dynamic";

export default async function ContainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getContainer(id);

  if (!result.data) {
    notFound();
  }

  const container = result.data as DockerContainer;

  return (
    <Container fluid>
      <Group mb="lg">
        <Link href="/docker" style={{ textDecoration: "none", color: "inherit" }}>
          <Group gap="xs" style={{ cursor: "pointer" }}>
            <IconArrowLeft size={20} />
            <Text>Back to Containers</Text>
          </Group>
        </Link>
      </Group>

      <Group justify="space-between" mb="lg">
        <Title order={2}>Container Details</Title>
        <ContainerActions containerId={container.Id} containerState={container.State} size="big" />
      </Group>

      <ContainerTabs container={container} />
    </Container>
  );
}
