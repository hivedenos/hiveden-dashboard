"use client";

import { createSmbShare, deleteSmbShare } from "@/actions/shares";
import { getComprehensiveLocations } from "@/actions/system";
import { SystemdServiceActions } from "@/components/Systemd/SystemdServiceActions";
import type { FilesystemLocation, SMBShare } from "@/lib/client";
import { ActionIcon, Autocomplete, Badge, Box, Button, Checkbox, Group, Modal, Stack, Table, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function SMBList({ shares }: { shares: SMBShare[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [creating, setCreating] = useState(false);
  const [systemLocations, setSystemLocations] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    comment: "",
    read_only: false,
    browsable: true,
    guest_ok: false,
  });

  useEffect(() => {
    if (opened) {
      getComprehensiveLocations()
        .then((response) => {
          if (response.data) {
            setSystemLocations(response.data.map((l: FilesystemLocation) => l.path).filter((fsPath, index, arr) => arr.indexOf(fsPath) === index));
          }
        })
        .catch(console.error);
    }
  }, [opened]);

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
      // Reset form
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

  const rows = shares.map((share) => (
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

  return (
    <Box>
      <SystemdServiceActions serviceName="smb" title="Samba Service (smb)" />

      <Group justify="flex-end" mb="md">
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Create Share
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Path</Table.Th>
            <Table.Th>Access</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

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
    </Box>
  );
}
