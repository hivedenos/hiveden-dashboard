import { Box, Group, Text, Stack } from '@mantine/core';
import type { OSInfo, HWInfo, VersionInfo } from '@/lib/client';
import { formatBytes } from '@/lib/format';

interface NeoFetchProps {
  osInfo: OSInfo;
  hwInfo: HWInfo;
  version: VersionInfo;
}

export function NeoFetch({ osInfo, hwInfo, version }: NeoFetchProps) {
  const linuxAscii = [
    '    .--.',
    '   |o_o |',
    '   |:_/ |',
    '  //   \\ \\',
    ' (|     | )',
    "/'\\_   _/`\\",
    '\\___)=(___/'
  ];

  // Colors for the info labels
  const labelColor = 'var(--mantine-color-blue-filled)';
  
  // Helper to format frequency
  const formatFreq = (mhz: number) => {
    return `${(mhz / 1000).toFixed(2)}GHz`;
  };

  const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <Group gap="xs" wrap="nowrap" align="flex-start">
      <Text c={labelColor} fw="bold" style={{ minWidth: 80 }}>{label}:</Text>
      <Text style={{ wordBreak: 'break-word', flex: 1 }}>{value}</Text>
    </Group>
  );

  return (
    <Box 
      style={{
        fontFamily: 'monospace',
        padding: '2rem',
        backgroundColor: 'var(--mantine-color-dark-8)',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    >
      <Group align="flex-start" gap="xl">
        {/* ASCII Art */}
        <Box visibleFrom="sm">
          <pre 
            style={{
              lineHeight: 1.2, 
              fontWeight: 'bold',
              color: 'var(--mantine-color-gray-5)',
              margin: 0
            }}
          >
            {linuxAscii.join('\n')}
          </pre>
        </Box>

        {/* Info Section */}
        <Stack gap={4} style={{ flex: 1 }}>
          <Group gap="xs">
            <Text c={labelColor} fw="bold">root</Text>
            <Text>@</Text>
            <Text c={labelColor} fw="bold">{osInfo.hostname}</Text>
          </Group>
          <Text c="dimmed" size="sm" mb="sm">-------------------</Text>

          <InfoRow label="OS" value={`${osInfo.system} ${osInfo.release}`} />
          <InfoRow label="Kernel" value={osInfo.release} />
          <InfoRow label="Hiveden" value={version.version} />
          <InfoRow 
            label="CPU" 
            value={`${hwInfo.cpu.total_cores} cores (${hwInfo.cpu.physical_cores} phys) @ ${formatFreq(hwInfo.cpu.max_frequency)}`}
          />
          <InfoRow 
            label="Memory" 
            value={`${formatBytes(hwInfo.memory.used)} / ${formatBytes(hwInfo.memory.total)} (${hwInfo.memory.percentage}%)`}
          />
          <InfoRow 
            label="Disk" 
            value={`${formatBytes(hwInfo.disk.used)} / ${formatBytes(hwInfo.disk.total)} (${hwInfo.disk.percentage}%)`}
          />
          <InfoRow label="Platform" value={osInfo.machine} />
        </Stack>
      </Group>
    </Box>
  );
}
