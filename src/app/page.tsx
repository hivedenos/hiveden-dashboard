import { getHwInfo, getOsInfo, getVersion } from '@/actions/info';
import { getSystemLocations } from '@/actions/system';
import { Container, Title, SimpleGrid } from '@mantine/core';
import { NeoFetch } from '@/components/Dashboard/NeoFetch';
import { StorageLocations } from '@/components/Dashboard/StorageLocations';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [osInfo, hwInfo, version, locationData] = await Promise.all([
    getOsInfo(), 
    getHwInfo(),
    getVersion(),
    getSystemLocations()
  ]);

  return (
    <Container fluid>
      <Title order={2} mb="lg">System Overview</Title>
      
      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
        <NeoFetch osInfo={osInfo} hwInfo={hwInfo} version={version} />
        <StorageLocations locations={locationData.data} />
      </SimpleGrid>
    </Container>
  );
}
