import { getHwInfo, getOsInfo, getVersion } from '@/actions/info';
import { Container, Title } from '@mantine/core';
import { NeoFetch } from '@/components/Dashboard/NeoFetch';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [osInfo, hwInfo, version] = await Promise.all([
    getOsInfo(), 
    getHwInfo(),
    getVersion()
  ]);

  return (
    <Container fluid>
      <Title order={2} mb="lg">System Overview</Title>
      <NeoFetch osInfo={osInfo} hwInfo={hwInfo} version={version} />
    </Container>
  );
}
