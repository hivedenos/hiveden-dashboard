import { listImages } from '@/actions/docker';
import { DockerImagesList } from '@/components/Docker/DockerImagesList';
import { Container, Group, Paper, Text, ThemeIcon, Title } from '@mantine/core';
import { IconPhotoScan } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function DockerImagesPage() {
  const imagesResponse = await listImages();
  const images = imagesResponse.data || [];

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
            <IconPhotoScan size={18} />
          </ThemeIcon>
          <div>
            <Title order={2}>Docker Images</Title>
            <Text size="sm" c="dimmed">
              Inspect image inventory, identify unused layers, and manage cleanup safely.
            </Text>
          </div>
        </Group>
      </Paper>
      <DockerImagesList images={images} />
    </Container>
  );
}
