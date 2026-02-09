import { getDiskDetails } from '@/actions/storage';
import { DiskDetails } from '@/components/Storage/DiskDetails';
import { BackButton } from '@/components/Storage/BackButton';
import { Badge, Container, Group, Paper, Text, ThemeIcon, Title } from '@mantine/core';
import { IconDatabase } from '@tabler/icons-react';

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
                <Paper withBorder radius="lg" p="lg">
                    <Text fw={600}>Disk not found</Text>
                    <Text c="dimmed" size="sm" mt={4}>
                        The requested disk could not be loaded. It may have been removed or renamed.
                    </Text>
                </Paper>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Group mb="md">
              <BackButton />
            </Group>
            <Paper withBorder radius="lg" p="lg" mb="md">
              <Group justify="space-between" align="flex-start" gap="md">
                <div>
                  <Group gap="xs" mb={6}>
                    <ThemeIcon variant="light" color="blue" radius="xl">
                      <IconDatabase size={16} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed" fw={600}>
                      Storage Device Details
                    </Text>
                  </Group>
                  <Title order={2}>Disk Details: {disk.name}</Title>
                  <Text c="dimmed" mt={6}>
                    Inspect health, partitions, and mount operations for this storage device.
                  </Text>
                </div>
                <Badge size="lg" variant="light" color="blue">
                  {disk.rotational ? "HDD" : "SSD"}
                </Badge>
              </Group>
            </Paper>
            <DiskDetails disk={disk} />
        </Container>
    );
}
