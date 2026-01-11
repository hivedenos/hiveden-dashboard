import { listSmbShares } from '@/actions/shares';
import { SMBList } from '@/components/Shares/SMBList';
import { Container, Title } from '@mantine/core';
import type { SMBShare, SMBMount } from '@/lib/client';

export const dynamic = 'force-dynamic';

export default async function SmbPage() {
  const smbResponse = await listSmbShares();
  const smbShares = (smbResponse.exported as SMBShare[]) || [];
  const smbMounts = (smbResponse.mounted as SMBMount[]) || [];

  return (
    <Container fluid>
      <Title order={2} mb="lg">SMB Shares</Title>
      <SMBList shares={smbShares} mounts={smbMounts} />
    </Container>
  );
}
