import { getHwInfo, getOsInfo, getVersion } from '@/actions/info';
import { getSystemLocations } from '@/actions/system';
import { Container, Title } from '@mantine/core';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [osInfo, hwInfo, version, locationData] = await Promise.all([
    getOsInfo(), 
    getHwInfo(),
    getVersion(),
    getSystemLocations()
  ]);

  const initialData = {
    osInfo,
    hwInfo,
    version,
    locations: locationData.data
  };

  return (
    <Container fluid>
      <Title order={2} mb="lg">System Overview</Title>
      <DashboardLayout initialData={initialData} />
    </Container>
  );
}
