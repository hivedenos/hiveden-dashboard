'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  Group, 
  ActionIcon, 
  Button, 
  Modal, 
  TextInput, 
  Select, 
  Stack, 
  Title, 
  Text,
  Badge,
  Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconPlus, IconDatabase } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { listDatabases, listUsers, createDatabase, deleteDatabase } from '@/actions/database';
import { formatBytes } from '@/lib/format';
import type { DatabaseInfo, DatabaseUser } from '@/lib/client';

export function DatabaseList() {
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  
  const [opened, { open, close }] = useDisclosure(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
  });

  const fetchData = async () => {
    try {
      const [dbsRes, usersRes] = await Promise.all([listDatabases(), listUsers()]);
      if (dbsRes.data) setDatabases(dbsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to fetch data',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (name: string) => {
    if (name === 'postgres' || name === 'hiveden') return; // Should be disabled in UI anyway
    if (!confirm(`Are you sure you want to delete database "${name}"? This action cannot be undone.`)) return;

    setDeleting(name);
    try {
      await deleteDatabase(name);
      notifications.show({
        title: 'Success',
        message: `Database "${name}" deleted successfully`,
        color: 'green'
      });
      await fetchData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete database',
        color: 'red'
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.owner) return;

    setCreating(true);
    try {
      await createDatabase({
        name: formData.name,
        owner: formData.owner
      });
      notifications.show({
        title: 'Success',
        message: `Database "${formData.name}" created successfully`,
        color: 'green'
      });
      close();
      setFormData({ name: '', owner: '' });
      await fetchData();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create database',
        color: 'red'
      });
    } finally {
      setCreating(false);
    }
  };

  const isProtected = (name: string) => name === 'postgres' || name === 'hiveden';

  if (loading) {
      return (
          <Group justify="center" p="xl">
              <Loader />
          </Group>
      );
  }

  const rows = databases.map((db) => (
    <Table.Tr key={db.name}>
      <Table.Td fw={500}>{db.name}</Table.Td>
      <Table.Td>{db.owner}</Table.Td>
      <Table.Td>{db.encoding}</Table.Td>
      <Table.Td>{formatBytes(db.size_bytes)}</Table.Td>
      <Table.Td>
        {isProtected(db.name) ? (
            <Badge variant="light" color="gray" size="sm">Protected</Badge>
        ) : (
            <ActionIcon 
                variant="light" 
                color="red" 
                onClick={() => handleDelete(db.name)}
                loading={deleting === db.name}
            >
                <IconTrash size={16} />
            </ActionIcon>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
        <Group justify="flex-end">
            <Button leftSection={<IconPlus size={16} />} onClick={() => {
                // Pre-select first user if available
                if (!formData.owner && users.length > 0) {
                    const defaultUser = users.find(u => u.name === 'postgres') || users[0];
                    setFormData(prev => ({ ...prev, owner: defaultUser.name }));
                }
                open();
            }}>
                Create Database
            </Button>
        </Group>

        <Table highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Owner</Table.Th>
                    <Table.Th>Encoding</Table.Th>
                    <Table.Th>Size</Table.Th>
                    <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>

        <Modal opened={opened} onClose={close} title="Create Database">
            <Stack>
                <TextInput 
                    label="Database Name" 
                    placeholder="my_database" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Select 
                    label="Owner" 
                    placeholder="Select owner"
                    data={users.map(u => u.name)}
                    value={formData.owner}
                    onChange={(val) => setFormData({ ...formData, owner: val || '' })}
                    required
                    searchable
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={close}>Cancel</Button>
                    <Button 
                        onClick={handleCreate} 
                        loading={creating}
                        disabled={!formData.name || !formData.owner}
                    >
                        Create
                    </Button>
                </Group>
            </Stack>
        </Modal>
    </Stack>
  );
}
