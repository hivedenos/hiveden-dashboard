"use client";

import { createSmbShare, deleteSmbShare, mountSmbShare, unmountSmbShare } from "@/actions/shares";
import { getComprehensiveLocations } from "@/actions/system";
import { SystemdServiceActions } from "@/components/Systemd/SystemdServiceActions";
import type { FilesystemLocation, SMBShare, SMBMount } from "@/lib/client";
import { ActionIcon, Alert, Autocomplete, Badge, Box, Button, Checkbox, Grid, Group, Modal, Paper, PasswordInput, ScrollArea, Stack, Table, Text, TextInput, ThemeIcon, Title, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconArrowDownRight, IconArrowUpRight, IconFolder, IconPlus, IconServer, IconShare, IconTrash, IconUnlink } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function SMBList({ shares, mounts }: { shares: SMBShare[]; mounts: SMBMount[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [mountLoading, setMountLoading] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [mountOpened, { open: openMount, close: closeMount }] = useDisclosure(false);
  
  const [creating, setCreating] = useState(false);
  const [mounting, setMounting] = useState(false);
  
  const [systemLocations, setSystemLocations] = useState<string[]>([]);

  // Create Form State
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    comment: "",
    read_only: false,
    browsable: true,
    guest_ok: false,
  });

  // Mount Form State
  const [mountForm, setMountForm] = useState({
    remote_path: "",
    mount_point: "",
    username: "",
    password: "",
    persist: false,
  });

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  useEffect(() => {
    if (opened || mountOpened) {
      getComprehensiveLocations()
        .then((response) => {
          if (response.data) {
            setSystemLocations(response.data.map((l: FilesystemLocation) => l.path).filter((fsPath, index, arr) => arr.indexOf(fsPath) === index));
          }
        })
        .catch(console.error);
    }
  }, [opened, mountOpened]);

  const handleDelete = async (name: string) => {
    if (!confirm("Are you sure you want to delete this share?")) return;
    setLoading(name);
    try {
      await deleteSmbShare(name);
      notifications.show({
        title: "Success",
        message: "Share deleted successfully",
        color: "green",
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to delete share"),
        color: "red",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleUnmount = async (mountPoint: string, removePersistence: boolean) => {
    const actionLabel = removePersistence ? "Unmount and Delete" : "Unmount";
    if (!confirm(`Are you sure you want to ${actionLabel} this share?`)) return;
    
    setMountLoading(mountPoint);
    try {
      await unmountSmbShare(mountPoint, removePersistence);
      notifications.show({
        title: "Success",
        message: `${actionLabel} successful`,
        color: "green",
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, `Failed to ${actionLabel.toLowerCase()}`),
        color: "red",
      });
    } finally {
      setMountLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.path) {
      notifications.show({
        title: "Validation Error",
        message: "Name and Path are required",
        color: "red",
      });
      return;
    }

    setCreating(true);
    try {
      await createSmbShare(formData);
      notifications.show({
        title: "Success",
        message: "Share created successfully",
        color: "green",
      });
      close();
      setFormData({
        name: "",
        path: "",
        comment: "",
        read_only: false,
        browsable: true,
        guest_ok: false,
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to create share"),
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleMount = async () => {
    if (!mountForm.remote_path || !mountForm.mount_point) {
       notifications.show({ title: "Error", message: "Remote Path and Mount Point are required", color: "red" });
       return;
    }

    setMounting(true);
    try {
        await mountSmbShare({
            ...mountForm,
            username: mountForm.username || null,
            password: mountForm.password || null,
        });
        notifications.show({ title: "Success", message: "Share mounted successfully", color: "green" });
        closeMount();
        setMountForm({ remote_path: "", mount_point: "", username: "", password: "", persist: false });
    } catch (error: unknown) {
        notifications.show({ title: "Error", message: getErrorMessage(error, "Failed to mount share"), color: "red" });
    } finally {
        setMounting(false);
    }
  };

  const shareRows = shares.map((share) => (
    <Table.Tr key={share.name}>
      <Table.Td fw={600}>{share.name}</Table.Td>
      <Table.Td>
        <Text size="sm" ff="monospace">
          {share.path}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Badge color={share.read_only ? "orange" : "green"} variant="light">
            {share.read_only ? "Read Only" : "Read/Write"}
          </Badge>
          {share.guest_ok && (
            <Badge color="blue" variant="light">
              Guest
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <ActionIcon variant="light" color="red" onClick={() => handleDelete(share.name)} loading={loading === share.name}>
          <IconTrash size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  const mountRows = mounts.map((mount) => (
    <Table.Tr key={mount.mount_point}>
      <Table.Td>
        <Text size="sm" ff="monospace">
          {mount.remote_path}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" ff="monospace">
          {mount.mount_point}
        </Text>
      </Table.Td>
      <Table.Td>
          <Badge color={mount.is_persistent ? "blue" : "gray"} variant="light">
            {mount.is_persistent ? "Persistent" : "Temporary"}
          </Badge>
      </Table.Td>
      <Table.Td>
          <Group gap="xs">
            <Tooltip label="Unmount">
              <ActionIcon 
                variant="light" 
                color="orange" 
                onClick={() => handleUnmount(mount.mount_point, false)}
                loading={mountLoading === mount.mount_point}
              >
                <IconUnlink size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Unmount & Remove Persistence">
              <ActionIcon 
                variant="light" 
                color="red" 
                onClick={() => handleUnmount(mount.mount_point, true)}
                loading={mountLoading === mount.mount_point}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box>
      <Stack gap="md">
        <SystemdServiceActions serviceName="smb" title="Samba Service (smb)" />

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  Exported
                </Text>
                <ThemeIcon variant="light" color="blue" size="sm">
                  <IconArrowUpRight size={14} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700} mt={4}>
                {shares.length}
              </Text>
              <Text size="xs" c="dimmed">
                Local shares served by Samba
              </Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  Mounted
                </Text>
                <ThemeIcon variant="light" color="teal" size="sm">
                  <IconArrowDownRight size={14} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700} mt={4}>
                {mounts.length}
              </Text>
              <Text size="xs" c="dimmed">
                Remote SMB paths mounted locally
              </Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  Persistent Mounts
                </Text>
                <ThemeIcon variant="light" color="grape" size="sm">
                  <IconServer size={14} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700} mt={4}>
                {mounts.filter((mount) => mount.is_persistent).length}
              </Text>
              <Text size="xs" c="dimmed">
                Configured to survive reboot
              </Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Group justify="flex-end">
          <Button leftSection={<IconServer size={16} />} variant="default" onClick={openMount}>
            Mount Remote Share
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Create Share
          </Button>
        </Group>

        <Paper withBorder radius="lg" p="lg">
          <Group justify="space-between" mb="sm">
            <Box>
              <Title order={4}>Exported Shares</Title>
              <Text size="sm" c="dimmed">
                Local directories exposed over SMB.
              </Text>
            </Box>
            <Badge color="blue" variant="light">
              {shares.length} total
            </Badge>
          </Group>

          {shares.length === 0 ? (
            <Alert icon={<IconFolder size={16} />} color="blue" variant="light" title="No exported shares">
              Create your first share to expose local paths to SMB clients.
            </Alert>
          ) : (
            <ScrollArea>
              <Table highlightOnHover withTableBorder withColumnBorders striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Path</Table.Th>
                    <Table.Th>Access</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{shareRows}</Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Paper>

        <Paper withBorder radius="lg" p="lg">
          <Group justify="space-between" mb="sm">
            <Box>
              <Title order={4}>Mounted Remote Shares</Title>
              <Text size="sm" c="dimmed">
                Remote SMB endpoints mounted into local filesystem paths.
              </Text>
            </Box>
            <Badge color="teal" variant="light">
              {mounts.length} total
            </Badge>
          </Group>

          {mounts.length === 0 ? (
            <Alert icon={<IconShare size={16} />} color="teal" variant="light" title="No mounted remote shares">
              Use &quot;Mount Remote Share&quot; to connect remote SMB exports to this host.
            </Alert>
          ) : (
            <ScrollArea>
              <Table highlightOnHover withTableBorder withColumnBorders striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Remote Path</Table.Th>
                    <Table.Th>Mount Point</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{mountRows}</Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Paper>
      </Stack>

      {/* Create Share Modal */}
      <Modal opened={opened} onClose={close} title="Create SMB Share" radius="lg">
        <Stack>
          <Text size="sm" c="dimmed">
            Define a local path and access settings to publish a new Samba share.
          </Text>
          <TextInput
            label="Name"
            placeholder="share_name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Autocomplete
            label="Path"
            placeholder="/mnt/storage/share"
            required
            value={formData.path}
            onChange={(val) => setFormData({ ...formData, path: val })}
            data={systemLocations}
          />
          <TextInput
            label="Comment"
            placeholder="Optional description"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          />
          <Checkbox
            label="Read Only"
            checked={formData.read_only}
            onChange={(e) => setFormData({ ...formData, read_only: e.currentTarget.checked })}
          />
          <Checkbox
            label="Browsable"
            checked={formData.browsable}
            onChange={(e) => setFormData({ ...formData, browsable: e.currentTarget.checked })}
          />
          <Checkbox label="Guest OK" checked={formData.guest_ok} onChange={(e) => setFormData({ ...formData, guest_ok: e.currentTarget.checked })} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              Create Share
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Mount Remote Share Modal */}
      <Modal opened={mountOpened} onClose={closeMount} title="Mount Remote SMB Share" radius="lg">
        <Stack>
            <Text size="sm" c="dimmed">
              Connect a remote SMB export to a local mount path. Credentials are optional depending on remote policy.
            </Text>
            <TextInput 
                label="Remote Path" 
                placeholder="//server/share" 
                required 
                value={mountForm.remote_path}
                onChange={(e) => setMountForm({ ...mountForm, remote_path: e.target.value })}
            />
            <Autocomplete
                label="Local Mount Point"
                placeholder="/mnt/remote/share"
                required
                value={mountForm.mount_point}
                onChange={(val) => setMountForm({ ...mountForm, mount_point: val })}
                data={systemLocations}
            />
            <TextInput 
                label="Username" 
                placeholder="Optional" 
                value={mountForm.username}
                onChange={(e) => setMountForm({ ...mountForm, username: e.target.value })}
            />
            <PasswordInput 
                label="Password" 
                placeholder="Optional" 
                value={mountForm.password}
                onChange={(e) => setMountForm({ ...mountForm, password: e.target.value })}
            />
            <Checkbox 
                label="Persist (Add to fstab)" 
                checked={mountForm.persist}
                onChange={(e) => setMountForm({ ...mountForm, persist: e.currentTarget.checked })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeMount}>
                Cancel
              </Button>
              <Button onClick={handleMount} loading={mounting}>
                Mount Share
              </Button>
            </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
