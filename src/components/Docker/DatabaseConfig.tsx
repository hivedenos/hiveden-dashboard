'use client';

import { useState, useEffect } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Button, 
  Select, 
  Loader, 
  Stack, 
  ThemeIcon, 
  Box,
  TextInput
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconDatabase, IconCheck, IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { listDatabases, listUsers, createDatabase } from '@/actions/database';
import { formatBytes } from '@/lib/format';
import type { DatabaseInfo, DatabaseUser } from '@/lib/client';

interface DatabaseConfigProps {
  containerName: string;
  onDatabaseCreated?: (dbName: string) => void;
  onDatabaseFound?: (dbName: string) => void;
}

export function DatabaseConfig({ containerName, onDatabaseCreated, onDatabaseFound }: DatabaseConfigProps) {
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  const [customDbName, setCustomDbName] = useState(containerName);
  const [debouncedDbName] = useDebouncedValue(customDbName, 500);

  useEffect(() => {
    if (containerName && !customDbName) {
        setCustomDbName(containerName);
    }
  }, [containerName]);

  const fetchData = async (nameToCheck: string) => {
    if (!nameToCheck) {
        setDbInfo(null);
        return;
    }
    
    setLoading(true);
    try {
      const [dbsResponse, usersResponse] = await Promise.all([
        listDatabases(),
        listUsers()
      ]);

      if (dbsResponse.data) {
        const found = dbsResponse.data.find(db => db.name === nameToCheck);
        setDbInfo(found || null);
        if (found && onDatabaseFound) {
            onDatabaseFound(found.name);
        }
      }

      if (usersResponse.data) {
        setUsers(usersResponse.data);
        if (!selectedOwner) {
            const defaultUser = usersResponse.data.find(u => u.name === 'postgres') || usersResponse.data[0];
            if (defaultUser) setSelectedOwner(defaultUser.name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch database info:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to check database status',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(debouncedDbName);
  }, [debouncedDbName]);

  const handleCreate = async () => {
    if (!customDbName || !selectedOwner) return;

    setCreating(true);
    try {
      await createDatabase({
        name: customDbName,
        owner: selectedOwner
      });
      
      notifications.show({
        title: 'Success',
        message: `Database "${customDbName}" created successfully`,
        color: 'green'
      });
      
      if (onDatabaseCreated) {
          onDatabaseCreated(customDbName);
      }

      await fetchData(customDbName); 
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

  if (!containerName && !customDbName) {
    return (
        <Paper p="md" withBorder radius="md">
            <Title order={4} mb="xs">Database Connection</Title>
            <Text c="dimmed" size="sm">Enter a container name to configure the database.</Text>
        </Paper>
    );
  }

  return (
    <Paper p="md" withBorder radius="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>Database Connection</Title>
        {dbInfo && (
            <ThemeIcon color="green" variant="light" size="sm">
                <IconCheck size={16} />
            </ThemeIcon>
        )}
      </Group>

      {loading && !users.length ? (
        <Group justify="center" p="md">
            <Loader size="sm" />
        </Group>
      ) : dbInfo ? (
        <Stack gap="xs">
            <Group>
                <IconDatabase size={20} style={{ opacity: 0.7 }} />
                <Text fw={500}>{dbInfo.name}</Text>
            </Group>
            <Group gap="xl">
                <Box>
                    <Text size="xs" c="dimmed">Owner</Text>
                    <Text size="sm">{dbInfo.owner}</Text>
                </Box>
                <Box>
                    <Text size="xs" c="dimmed">Encoding</Text>
                    <Text size="sm">{dbInfo.encoding}</Text>
                </Box>
                <Box>
                    <Text size="xs" c="dimmed">Size</Text>
                    <Text size="sm">{formatBytes(dbInfo.size_bytes)}</Text>
                </Box>
            </Group>
        </Stack>
      ) : (
        <Stack>
            <TextInput 
                label="Database Name"
                value={customDbName}
                onChange={(e) => setCustomDbName(e.target.value)}
                description={
                    <Text component="span" size="xs">
                        Database <Text span fw={700}>{customDbName}</Text> does not exist.
                    </Text>
                }
            />
            <Group align="flex-end" grow>
                <Select 
                    label="Owner"
                    placeholder="Select owner"
                    data={users.map(u => u.name)}
                    value={selectedOwner}
                    onChange={setSelectedOwner}
                    searchable
                />
                <Button 
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreate}
                    loading={creating}
                    disabled={!selectedOwner || !customDbName}
                >
                    Create
                </Button>
            </Group>
        </Stack>
      )}
    </Paper>
  );
}