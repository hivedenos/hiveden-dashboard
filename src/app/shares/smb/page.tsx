import { listSmbShares } from '@/actions/shares';
import { SMBList } from '@/components/Shares/SMBList';
import { Badge, Container, Group, Paper, Text, ThemeIcon, Title } from '@mantine/core';
import type { SMBShare, SMBMount } from '@/lib/client';
import { IconShare } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function SmbPage() {
  const smbResponse = await listSmbShares();
  const smbShares = (smbResponse.exported as SMBShare[]) || [];
  const smbMounts = (smbResponse.mounted as SMBMount[]) || [];

  return (
    <Container fluid>
      <Paper withBorder radius="lg" p="lg" mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <div>
            <Group gap="xs" mb={6}>
              <ThemeIcon variant="light" color="blue" radius="xl">
                <IconShare size={16} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                Samba Share Management
              </Text>
            </Group>
            <Title order={2}>SMB Shares</Title>
            <Text c="dimmed" mt={6}>
              Manage exported local shares and mounted remote SMB endpoints from one workspace.
            </Text>
          </div>
          <Badge size="lg" color="blue" variant="light">
            Live View
          </Badge>
        </Group>
      </Paper>
      <SMBList shares={smbShares} mounts={smbMounts} />
    </Container>
  );
}
