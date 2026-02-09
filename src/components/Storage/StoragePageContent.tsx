"use client";

import {
  applyStorageStrategy,
  createBtrfsShare,
  listBtrfsShares,
  listBtrfsVolumes,
  listStorageDevices,
  listStorageStrategies,
} from "@/actions/storage";
import { Terminal } from "@/components/Terminal/Terminal";
import type { BtrfsShare, BtrfsVolume, Disk, PackageStatus, StorageStrategy } from "@/lib/client";
import { formatBytes } from "@/lib/format";
import { getWebSocketUrl } from "@/lib/shellClient";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import {
  IconAlertTriangle,
  IconDatabase,
  IconFolder,
  IconFolderPlus,
  IconLayoutGrid,
  IconRosetteDiscountCheckFilled,
  IconShare,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DiskInventory } from "./DiskInventory";
import { PrerequisitesBanner } from "./PrerequisitesBanner";
import { StrategyWizard } from "./StrategyWizard";

interface StoragePageContentProps {
  initialDisks: Disk[];
  initialPackages: PackageStatus[];
}

export function StoragePageContent({ initialDisks, initialPackages }: StoragePageContentProps) {
  const router = useRouter();
  const [disks, setDisks] = useState<Disk[]>(initialDisks);
  const [strategies, setStrategies] = useState<StorageStrategy[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [loadingStrategies, setLoadingStrategies] = useState(false);

  // Application Flow State
  const [selectedStrategy, setSelectedStrategy] = useState<StorageStrategy | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  // Shares State
  const [btrfsVolumes, setBtrfsVolumes] = useState<BtrfsVolume[]>([]);
  const [btrfsShares, setBtrfsShares] = useState<BtrfsShare[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [creatingShare, setCreatingShare] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Share Form State
  const [shareForm, setShareForm] = useState({
    volume: "",
    name: "",
    mountPath: "",
  });

  const totalDisks = disks.length;
  const availableDisks = disks.filter((d) => d.available).length;
  const raidGroups = new Set(disks.map((d) => d.raid_group).filter(Boolean)).size;
  const totalCapacityBytes = disks.reduce((acc, d) => acc + (d.size || 0), 0);

  // Polling for disk updates
  const refreshDisks = useCallback(async () => {
    try {
      const response = await listStorageDevices();
      if (response.data) {
        setDisks(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh disks:", error);
    }
  }, []);

  const refreshShares = useCallback(async () => {
    try {
      const response = await listBtrfsShares();
      console.log(response);
      if (response.data) {
        setBtrfsShares(response.data as BtrfsShare[]);
      }
    } catch (error) {
      console.error("Failed to refresh shares:", error);
    }
  }, []);

  const { start, stop } = useInterval(() => {
    refreshDisks();
    refreshShares(); // Also refresh shares periodically
  }, 30000);

  // Initial load for shares
  useEffect(() => {
    refreshShares();
  }, [refreshShares]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const handleCreatePool = async () => {
    setLoadingStrategies(true);
    setIsWizardOpen(true);
    try {
      const response = await listStorageStrategies();
      if (response.data) {
        setStrategies(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch strategies:", error);
    } finally {
      setLoadingStrategies(false);
    }
  };

  const handleStrategySelect = (strategy: StorageStrategy) => {
    setSelectedStrategy(strategy);
    setIsWizardOpen(false); // Close wizard
    setIsConfirmOpen(true); // Open confirmation
  };

  const handleConfirmApply = async () => {
    if (!selectedStrategy) return;

    setIsConfirmOpen(false);

    try {
      const response = await applyStorageStrategy(selectedStrategy);
      const data = response.data; // Now typed as JobInfo
      if (data && data.job_id) {
        setJobId(data.job_id);
        setIsTerminalOpen(true);
      }
    } catch (error) {
      console.error("Failed to apply strategy:", error);
      // Ideally show error notification here
    }
  };

  const handleDiskClick = (disk: Disk) => {
    if (disk.raid_group) {
      router.push(`/storage/raid/${disk.raid_group}`);
    } else {
      router.push(`/storage/${disk.name}`);
    }
  };

  const handleOpenShareModal = async () => {
    setLoadingVolumes(true);
    setIsShareModalOpen(true);
    setShareSuccess(false);
    setShareForm({ volume: "", name: "", mountPath: "" });

    try {
      const response = await listBtrfsVolumes();
      if (response.data) {
        setBtrfsVolumes(response.data as BtrfsVolume[]);
      }
    } catch (error) {
      console.error("Failed to fetch volumes:", error);
    } finally {
      setLoadingVolumes(false);
    }
  };

  const handleShareNameChange = (name: string) => {
    // Auto-fill mount path if it hasn't been manually edited
    const sanitized = name.replace(/[^a-zA-Z0-9]/g, "");
    setShareForm((prev) => ({
      ...prev,
      name: sanitized,
      mountPath: sanitized ? `/shares/${sanitized}` : "",
    }));
  };

  const handleCreateShare = async () => {
    if (!shareForm.volume || !shareForm.name || !shareForm.mountPath) return;

    setCreatingShare(true);
    try {
      await createBtrfsShare({
        parent_path: shareForm.volume,
        name: shareForm.name,
        mount_path: shareForm.mountPath,
      });
      setShareSuccess(true);
      // Refresh shares list immediately
      refreshShares();
      setTimeout(() => {
        setIsShareModalOpen(false);
        setShareSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to create share:", error);
      alert("Failed to create share");
    } finally {
      setCreatingShare(false);
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
          // Refresh disks when job is done
          setTimeout(() => {
            refreshDisks();
          }, 2000);
        }
      } catch {
        // ignore
      }
    });

    return ws;
  }, [jobId, refreshDisks]);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper withBorder radius="lg" p="lg">
          <Group justify="space-between" align="flex-start" gap="md">
            <Box>
              <Group gap="xs" mb={6}>
                <ThemeIcon variant="light" color="blue" radius="xl">
                  <IconDatabase size={16} />
                </ThemeIcon>
                <Text size="sm" c="dimmed" fw={600}>
                  Storage Control Center
                </Text>
              </Group>
              <Title order={1}>Storage</Title>
              <Text c="dimmed" mt={6}>
                Manage physical disks, pool provisioning, and Btrfs shares from a single workspace.
              </Text>
            </Box>
            <Badge size="lg" color="blue" variant="light">
              Live Inventory
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mt="lg">
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Disks
                </Text>
                <ThemeIcon size="sm" variant="light" color="blue">
                  <IconLayoutGrid size={14} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" mt={4}>
                {totalDisks}
              </Text>
              <Text size="xs" c="dimmed">
                Detected storage devices
              </Text>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Available
                </Text>
                <ThemeIcon size="sm" variant="light" color="teal">
                  <IconRosetteDiscountCheckFilled size={14} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" mt={4}>
                {availableDisks}
              </Text>
              <Text size="xs" c="dimmed">
                Ready for pool creation
              </Text>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  RAID Groups
                </Text>
                <ThemeIcon size="sm" variant="light" color="grape">
                  <IconDatabase size={14} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" mt={4}>
                {raidGroups}
              </Text>
              <Text size="xs" c="dimmed">
                Active grouped arrays
              </Text>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Raw Capacity
                </Text>
                <ThemeIcon size="sm" variant="light" color="orange">
                  <IconDatabase size={14} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" mt={4}>
                {formatBytes(totalCapacityBytes)}
              </Text>
              <Text size="xs" c="dimmed">
                Sum of all listed disks
              </Text>
            </Paper>
          </SimpleGrid>
        </Paper>

        <PrerequisitesBanner packages={initialPackages} />

        <Tabs defaultValue="disks" variant="pills" radius="xl">
          <Tabs.List>
            <Tabs.Tab value="disks" leftSection={<IconDatabase size={16} />}>
              Disks & Pools
            </Tabs.Tab>
            <Tabs.Tab value="shares" leftSection={<IconShare size={16} />}>
              Shares
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="disks" pt="md">
            <Paper withBorder radius="lg" p="lg">
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Box>
                    <Title order={3}>Physical Disks</Title>
                    <Text c="dimmed" size="sm">
                      Click a disk or array to inspect details and configuration.
                    </Text>
                  </Box>
                  <Button onClick={handleCreatePool}>Create Storage Pool</Button>
                </Group>

                <DiskInventory disks={disks} onDiskClick={handleDiskClick} />
              </Stack>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="shares" pt="md">
            <Paper withBorder radius="lg" p="lg">
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Box>
                    <Title order={3}>Shared Folders</Title>
                    <Text c="dimmed" size="sm">
                      Btrfs-backed shares for services and network access.
                    </Text>
                  </Box>
                  <Button leftSection={<IconFolderPlus size={16} />} onClick={handleOpenShareModal}>
                    Create Share
                  </Button>
                </Group>

                {btrfsShares.length === 0 ? (
                  <Paper withBorder radius="md" p="lg">
                    <Stack gap="xs" align="center">
                      <ThemeIcon size="xl" radius="xl" variant="light" color="blue">
                        <IconFolder size={22} />
                      </ThemeIcon>
                      <Text fw={600}>No shares found</Text>
                      <Text size="sm" c="dimmed" ta="center">
                        You have not created any shares yet. Create one to expose persistent storage paths.
                      </Text>
                      <Button mt="xs" leftSection={<IconFolderPlus size={16} />} onClick={handleOpenShareModal}>
                        Create First Share
                      </Button>
                    </Stack>
                  </Paper>
                ) : (
                  <ScrollArea>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Mount Path</Table.Th>
                          <Table.Th>Storage Pool (Parent)</Table.Th>
                          <Table.Th>Device</Table.Th>
                          <Table.Th>ID</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {btrfsShares.map((share) => (
                          <Table.Tr key={share.mount_path}>
                            <Table.Td fw={500}>
                              <Group gap="xs">
                                <ThemeIcon size="sm" variant="light" color="blue">
                                  <IconFolder size={14} />
                                </ThemeIcon>
                                {share.name}
                              </Group>
                            </Table.Td>
                            <Table.Td>{share.mount_path}</Table.Td>
                            <Table.Td>{share.parent_path}</Table.Td>
                            <Table.Td>
                              <Badge variant="outline" color="gray">
                                {share.device}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{share.subvolid}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                )}
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Wizard Modal */}
      <Modal opened={isWizardOpen} onClose={() => setIsWizardOpen(false)} title="Create New Storage Pool" size="xl">
        <div style={{ position: "relative", minHeight: 200 }}>
          <LoadingOverlay visible={loadingStrategies} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          {!loadingStrategies && <StrategyWizard strategies={strategies} onSelect={handleStrategySelect} />}
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal opened={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Storage Configuration" size="md">
        <Stack gap="md">
          <Alert color="red" icon={<IconAlertTriangle />}>
            Warning: This action will erase ALL data on the selected disks.
          </Alert>

          {selectedStrategy && (
            <Stack gap="xs">
              <Text fw={500}>{selectedStrategy.name}</Text>
              <Text size="sm">The following disks will be formatted:</Text>
              <Stack gap={4} pl="md">
                {selectedStrategy.disks.map((d) => (
                  <Text key={d} size="xs" ff="monospace">
                    {d}
                  </Text>
                ))}
              </Stack>
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleConfirmApply}>
              I Understand, Apply Configuration
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Terminal/Progress Modal */}
      <Modal
        opened={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        title="Applying Storage Configuration"
        size="xl"
        closeOnClickOutside={false}
      >
        <Terminal title="Configuration Log" socketFactory={socketFactory} onClose={() => setIsTerminalOpen(false)} />
      </Modal>

      {/* Create Share Modal */}
      <Modal opened={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Create New Share">
        <div style={{ position: "relative" }}>
          <LoadingOverlay visible={loadingVolumes || creatingShare} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

          {shareSuccess ? (
            <Alert color="green" title="Success">
              Share created successfully!
            </Alert>
          ) : (
            <Stack gap="md">
              <Select
                label="Select Storage Pool"
                placeholder="Choose a Btrfs volume"
                data={btrfsVolumes.map((v) => ({
                  value: v.mountpoint,
                  label: `${v.mountpoint} ${v.label ? `(${v.label})` : ""}${v.parent_path ? ` (Parent: ${v.parent_path})` : ""}`,
                }))}
                value={shareForm.volume}
                onChange={(val) => setShareForm((prev) => ({ ...prev, volume: val || "" }))}
              />

              <TextInput
                label="Share Name"
                placeholder="e.g. documents"
                description="Alphanumeric characters only"
                value={shareForm.name}
                onChange={(e) => handleShareNameChange(e.currentTarget.value)}
              />

              <TextInput
                label="Mount Path"
                placeholder="/shares/..."
                value={shareForm.mountPath}
                onChange={(e) => setShareForm((prev) => ({ ...prev, mountPath: e.currentTarget.value }))}
                description="Where this share will be accessible in the system"
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setIsShareModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateShare} disabled={!shareForm.volume || !shareForm.name || !shareForm.mountPath}>
                  Create Share
                </Button>
              </Group>
            </Stack>
          )}
        </div>
      </Modal>
    </Container>
  );
}
