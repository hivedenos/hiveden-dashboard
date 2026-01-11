"use client";

import { createSmbShare, deleteSmbShare, mountSmbShare, unmountSmbShare } from "@/actions/shares";
import { getComprehensiveLocations } from "@/actions/system";
import { SystemdServiceActions } from "@/components/Systemd/SystemdServiceActions";
import type { FilesystemLocation, SMBShare, SMBMount } from "@/lib/client";
import { ActionIcon, Autocomplete, Badge, Box, Button, Checkbox, Group, Modal, PasswordInput, Stack, Table, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconServer, IconTrash, IconUnlink } from "@tabler/icons-react";
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
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to delete share",
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
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || `Failed to ${actionLabel.toLowerCase()}`,
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
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create share",
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
    } catch (error: any) {
        notifications.show({ title: "Error", message: error.message || "Failed to mount share", color: "red" });
    } finally {
        setMounting(false);
    }
  };

  const shareRows = shares.map((share) => (
    <Table.Tr key={share.name}>
      <Table.Td>{share.name}</Table.Td>
      <Table.Td>{share.path}</Table.Td>
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
      <Table.Td>{mount.remote_path}</Table.Td>
      <Table.Td>{mount.mount_point}</Table.Td>
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
      <SystemdServiceActions serviceName="smb" title="Samba Service (smb)" />

      <Group justify="flex-end" mb="md">
        <Button leftSection={<IconServer size={16} />} variant="default" onClick={openMount}>
           Mount Remote Share
        </Button>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Create Share
        </Button>
      </Group>

      <Stack gap="xl">
        <Box>
            <Title order={4} mb="sm">Exported Shares</Title>
            {shares.length === 0 ? (
                <Text c="dimmed">No exported shares.</Text>
            ) : (
                <Table>
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
            )}
        </Box>

        <Box>
            <Title order={4} mb="sm">Mounted Remote Shares</Title>
            {mounts.length === 0 ? (
                <Text c="dimmed">No mounted remote shares.</Text>
            ) : (
                <Table>
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
            )}
        </Box>
      </Stack>

      {/* Create Share Modal */}
      <Modal opened={opened} onClose={close} title="Create SMB Share">
        <Stack>
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
          <Button onClick={handleCreate} loading={creating} mt="md">
            Create
          </Button>
        </Stack>
      </Modal>

      {/* Mount Remote Share Modal */}
      <Modal opened={mountOpened} onClose={closeMount} title="Mount Remote SMB Share">
        <Stack>
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
            <Button onClick={handleMount} loading={mounting} mt="md">
                Mount
            </Button>
        </Stack>
      </Modal>
    </Box>
  );
}