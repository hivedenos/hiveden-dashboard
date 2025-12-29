import { getSystemLocations } from '@/actions/system';
import { listBtrfsVolumes } from '@/actions/storage';
import { StorageLocationEdit } from '@/components/System/StorageLocationEdit';
import { Alert, Container } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export default async function EditLocationPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  
  // Fetch data
  try {
    const [locationsResponse, volumesResponse] = await Promise.all([
      getSystemLocations(),
      listBtrfsVolumes()
    ]);

    const location = locationsResponse.data.find(l => l.key === name);
    const volumes = Array.isArray(volumesResponse.data) ? volumesResponse.data : [];

    if (!location) {
      return (
        <Container fluid p="md">
          <Alert color="red" title="Not Found" icon={<IconAlertCircle />}>
            Location "{name}" not found.
          </Alert>
        </Container>
      );
    }

    return (
      <Container fluid>
        <StorageLocationEdit location={location} volumes={volumes} />
      </Container>
    );
  } catch (error) {
    return (
      <Container fluid p="md">
         <Alert color="red" title="Error" icon={<IconAlertCircle />}>
            Failed to load data.
         </Alert>
      </Container>
    );
  }
}
