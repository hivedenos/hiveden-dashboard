import { getDiskDetails } from '@/actions/storage';
import { DiskDetails } from '@/components/Storage/DiskDetails';
import { BackButton } from '@/components/Storage/BackButton';
import { Container, Title, Group } from '@mantine/core';

interface StorageDetailPageProps {
  params: Promise<{ name: string }>;
}

export default async function StorageDetailPage({ params }: StorageDetailPageProps) {
    const { name } = await params;
    const response = await getDiskDetails(name);
    const disk = response.data;

    if (!disk) {
        return (
            <Container size="xl" py="xl">
                <Group mb="lg">
                    <BackButton />
                </Group>
                <div>Disk not found</div>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Group mb="lg">
                <BackButton />
                <Title order={2}>Disk Details: {disk.name}</Title>
            </Group>
            <DiskDetails disk={disk} />
        </Container>
    );
}
