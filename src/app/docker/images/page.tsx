import { listImages } from '@/actions/docker';
import { DockerImagesList } from '@/components/Docker/DockerImagesList';
import { Container, Title } from '@mantine/core';

export const dynamic = 'force-dynamic';

export default async function DockerImagesPage() {
  const imagesResponse = await listImages();
  const images = imagesResponse.data || [];

  return (
    <Container fluid>
      <Title order={2} mb="lg">Docker Images</Title>
      <DockerImagesList images={images} />
    </Container>
  );
}
