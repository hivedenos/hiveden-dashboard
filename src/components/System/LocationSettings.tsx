'use client';

import { useEffect, useState } from 'react';
import { 
  Title, 
  Paper, 
  Table, 
  Button, 
  Group, 
  LoadingOverlay, 
  Badge,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import type { FilesystemLocation } from '@/lib/client';
import { getSystemLocations } from '@/actions/system';
import Link from 'next/link';


export function LocationSettings() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<FilesystemLocation[]>([]);
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getSystemLocations();
      setLocations(response.data);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load system locations',
        color: 'red',
        icon: <IconAlertCircle size="1.1rem" />,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Paper p="md" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Title order={3} mb="md">Storage Locations</Title>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Path</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th style={{ width: 140 }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {locations.map((loc) => (
            <Table.Tr key={loc.key}>
              <Table.Td>
                <Group gap="xs">
                  <Text fw={500}>{loc.label}</Text>
                  <Text size="xs" c="dimmed">({loc.key})</Text>
                </Group>
              </Table.Td>
              <Table.Td>{loc.description}</Table.Td>
              <Table.Td>
                <Text ff="monospace" size="sm">{loc.path}</Text>
              </Table.Td>
              <Table.Td>
                {loc.exists ? (
                  <Badge color="green" variant="light">Active</Badge>
                ) : (
                  <Badge color="yellow" variant="light">Pending</Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Button 
                  component={Link}
                  href={`/system/storage-locations/${loc.key}`}
                  variant="light" 
                  color="blue" 
                  size="xs"
                >
                  Set Location
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
