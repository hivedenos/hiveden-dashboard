import { listSmbShares, listZfsPools } from '@/actions/shares';
import { SharesTabs } from '@/components/Shares/SharesTabs';
import { Container, Title } from '@mantine/core';
import type { SMBShare, ZFSPool, SMBMount } from '@/lib/client';

export const dynamic = 'force-dynamic';

export default async function SharesPage() {
  const [smbResponse, zfsPools] = await Promise.all([
    listSmbShares(),
    listZfsPools()
  ]);

  const smbShares = (smbResponse.exported as SMBShare[]) || [];
  const smbMounts = (smbResponse.mounted as SMBMount[]) || [];

  return (
    <Container fluid>
      <Title order={2} mb="lg">Storage & Shares</Title>
      <SharesTabs 
        smbShares={smbShares} 
        smbMounts={smbMounts}
        zfsPools={(zfsPools.data as ZFSPool[]) || []} 
      />
    </Container>
  );
}
