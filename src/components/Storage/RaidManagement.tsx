"use client";

import { addDiskToRaid } from "@/actions/storage";
import { Terminal } from "@/components/Terminal/Terminal";
import type { Disk } from "@/lib/client";
import { formatBytes } from "@/lib/format";
import { getWebSocketUrl } from "@/lib/shellClient";
import { Badge, Button, Card, Code, Group, Modal, Select, SimpleGrid, Stack, Text, ThemeIcon, Title, UnstyledButton } from "@mantine/core";
import { IconDatabase, IconDeviceFloppy, IconPlus, IconServer } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

interface RaidManagementProps {
  raidId: string;
  allDisks: Disk[];
}

export function RaidManagement({ raidId, allDisks }: RaidManagementProps) {
  const router = useRouter();

  // Filter disks
  const memberDisks = allDisks.filter((d) => d.raid_group === raidId);
  const availableDisks = allDisks.filter((d) => d.available && !d.raid_group && !d.is_system);

  // Get RAID level from the first member disk (assuming consistent)
  const currentRaidLevel = memberDisks[0]?.raid_level || "Unknown RAID";

  // State for adding disk
  const [selectedDisk, setSelectedDisk] = useState<Disk | null>(null);
  const [targetRaidLevel, setTargetRaidLevel] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // State for Job/Terminal
  const [jobId, setJobId] = useState<string | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const handleDiskClick = (diskName: string) => {
    router.push(`/storage/${diskName}`);
  };

  const openAddDiskModal = (disk: Disk) => {
    setSelectedDisk(disk);
    setTargetRaidLevel(currentRaidLevel); // Default to current level
    setIsConfirmOpen(true);
  };

  const handleAddDisk = async () => {
    if (!selectedDisk) return;

    setIsConfirmOpen(false);
    try {
      const response = await addDiskToRaid(raidId, selectedDisk.path, targetRaidLevel || undefined);
       if (response.data && response.data.job_id) {
        setJobId(response.data.job_id);
        setIsTerminalOpen(true);
      }
    } catch (error) {
      console.error("Failed to add disk to RAID:", error);
      // Implement error notification here
    }
  };

  const socketFactory = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    if (!jobId) return new WebSocket(wsUrl); // Fallback

    const ws = new WebSocket(`${wsUrl}/shell/ws/jobs/${jobId}`);

    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "job_completed") {
           // Reload page to reflect changes
           setTimeout(() => {
             router.refresh();
           }, 2000);
        }
      } catch {
        // ignore
      }
    });

    return ws;
  }, [jobId, router]);


  return (
    <Stack gap="xl">
      <Card withBorder padding="lg" radius="md">
        <Group mb="md">
          <ThemeIcon size="xl" variant="light" color="indigo">
            <IconServer size={28} />
          </ThemeIcon>
          <div>
            <Title order={3}>
              {currentRaidLevel.toUpperCase()} ({raidId})
            </Title>
            <Text c="dimmed">{memberDisks.length} Member Disks</Text>
          </div>
        </Group>

        <Text fw={500} mb="sm">
          Member Disks
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {memberDisks.map((disk) => (
            <DiskCard key={disk.path} disk={disk} onClick={() => handleDiskClick(disk.name)} isMember />
          ))}
        </SimpleGrid>
      </Card>

      <div>
        <Group mb="sm">
            <IconDatabase size={20} />
            <Title order={4}>Available Disks</Title>
        </Group>
        <Text c="dimmed" size="sm" mb="md">
            These disks are available and can be added to the array.
        </Text>
        
        {availableDisks.length === 0 ? (
            <Card withBorder padding="md" radius="md" bg="var(--mantine-color-gray-0)">
                <Text c="dimmed" ta="center">No available disks found.</Text>
            </Card>
        ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {availableDisks.map((disk) => (
                <DiskCard 
                    key={disk.path} 
                    disk={disk} 
                    onClick={() => handleDiskClick(disk.name)} 
                    onAdd={() => openAddDiskModal(disk)}
                />
            ))}
            </SimpleGrid>
        )}
      </div>

       {/* Add Disk Confirmation Modal */}
       <Modal opened={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Add Disk to RAID Array">
        <Stack gap="md">
          <Text>
            Are you sure you want to add <Code>{selectedDisk?.name}</Code> ({selectedDisk?.path}) to RAID group <Code>{raidId}</Code>?
          </Text>
          <Text size="sm" c="red">
            Warning: This action will erase all data on the new disk.
          </Text>

          <Select
            label="Target RAID Level"
            description="You can optionally migrate the RAID level."
            data={[
              { value: 'raid0', label: 'RAID 0 (Striping)' },
              { value: 'raid1', label: 'RAID 1 (Mirroring)' },
              { value: 'raid5', label: 'RAID 5 (Parity)' },
              { value: 'raid6', label: 'RAID 6 (Double Parity)' },
              { value: 'raid10', label: 'RAID 10 (Mirroring + Striping)' },
            ]}
            value={targetRaidLevel}
            onChange={setTargetRaidLevel}
            allowDeselect={false}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button color="indigo" onClick={handleAddDisk}>Add Disk</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Terminal Modal for Job Progress */}
      <Modal opened={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} title="Adding Disk to RAID" size="xl" closeOnClickOutside={false}>
        <Terminal title="Operation Log" socketFactory={socketFactory} onClose={() => setIsTerminalOpen(false)} />
      </Modal>
    </Stack>
  );
}

function DiskCard({ disk, onClick, isMember, onAdd }: { disk: Disk; onClick: () => void; isMember?: boolean; onAdd?: () => void }) {
  const Icon = disk.rotational ? IconDatabase : IconDeviceFloppy;

  return (
      <Card shadow="sm" padding="lg" radius="md" withBorder className="hover:shadow-md" style={{ transition: "box-shadow 0.2s" }}>
        <Group justify="space-between" mb="xs">
          <UnstyledButton onClick={onClick} style={{ flex: 1 }}>
            <Group gap="xs">
                <ThemeIcon color={isMember ? "indigo" : "blue"} variant="light">
                <Icon size={16} />
                </ThemeIcon>
                <Text fw={500}>{disk.name}</Text>
            </Group>
          </UnstyledButton>
          <Group gap="xs">
             {isMember ? (
                 <Badge color="indigo">Member</Badge> 
             ) : (
                <>
                    <Badge color="green">Available</Badge>
                    {onAdd && (
                        <UnstyledButton onClick={(e) => { e.stopPropagation(); onAdd(); }}>
                            <ThemeIcon color="green" variant="light" style={{ cursor: 'pointer' }}>
                                <IconPlus size={16} />
                            </ThemeIcon>
                        </UnstyledButton>
                    )}
                </>
             )}
          </Group>
        </Group>

        <UnstyledButton onClick={onClick} style={{ width: '100%', display: 'block' }}>
            <Stack gap="xs">
            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                Size
                </Text>
                <Text size="sm" fw={500}>
                {formatBytes(disk.size)}
                </Text>
            </Group>
            <Group justify="space-between">
                <Text size="sm" c="dimmed">
                Model
                </Text>
                <Text size="sm" fw={500} lineClamp={1}>
                {disk.model || "Unknown"}
                </Text>
            </Group>
            <Group justify="space-between">
                <Text size="sm" c="dimmed">Path</Text>
                <Code>{disk.path}</Code>
            </Group>
            </Stack>
        </UnstyledButton>
      </Card>
  );
}