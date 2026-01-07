'use client';

import { Tabs, Text, Box, rem } from '@mantine/core';
import { SMBList } from './SMBList';
import type { SMBShare, ZFSPool } from '@/lib/client';
import { IconShare, IconDatabase } from '@tabler/icons-react';

export function SharesTabs({ smbShares, zfsPools }: { smbShares: SMBShare[], zfsPools: ZFSPool[] }) {
  const iconStyle = { width: rem(14), height: rem(14) };

  return (
    <Tabs defaultValue="smb" variant="outline" radius="md">
      <Tabs.List mb="md">
        <Tabs.Tab value="smb" leftSection={<IconShare style={iconStyle} />}>
          SMB Shares
        </Tabs.Tab>
        <Tabs.Tab value="zfs" leftSection={<IconDatabase style={iconStyle} />}>
          ZFS Pools
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="smb">
        <SMBList shares={smbShares} />
      </Tabs.Panel>

      <Tabs.Panel value="zfs">
        <Box p="md">
          <Text size="sm" c="dimmed" mb="md">Management for ZFS Pools will be implemented here.</Text>
          <Box bg="gray.0" p="sm" style={{ borderRadius: rem(4) }}>
             <Text size="xs" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {JSON.stringify(zfsPools, null, 2)}
             </Text>
          </Box>
        </Box>
      </Tabs.Panel>
    </Tabs>
  );
}