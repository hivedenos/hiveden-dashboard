'use client';

import { useEffect, useState } from 'react';
import { 
  Paper, 
  Title, 
  Text, 
  Group, 
  Stack, 
  Badge, 
  Loader, 
  ThemeIcon, 
  TextInput,
  Switch,
  ActionIcon,
  PasswordInput,
  Button
} from '@mantine/core';
import { IconServer, IconAlertCircle, IconCheck, IconX, IconExternalLink } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getDnsConfig, updateDnsConfig } from '@/actions/system';
import type { DNSConfigResponse } from '@/lib/client';
import Link from 'next/link';

export function DNSSettings() {
  const [data, setData] = useState<DNSConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDnsConfig();
        setData(response);
        if (response.api_key) {
            setApiKey(response.api_key);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch DNS configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateApiKey = async () => {
    setUpdating(true);
    try {
      await updateDnsConfig({ api_key: apiKey });
      notifications.show({
        title: 'Success',
        message: 'DNS API Key updated successfully',
        color: 'green',
      });
      // Optionally refresh data?
      const response = await getDnsConfig();
      setData(response);
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update API Key',
        color: 'red',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Paper p="md" withBorder radius="md">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="md" withBorder radius="md">
        <Stack align="center" p="xl">
          <ThemeIcon color="red" size="lg" variant="light">
            <IconAlertCircle />
          </ThemeIcon>
          <Text c="red">{error}</Text>
        </Stack>
      </Paper>
    );
  }

  if (!data) return null;

  return (
    <Stack gap="md">
      <Paper p="md" withBorder radius="md">
        <Title order={4} mb="md">DNS Configuration Status</Title>
        
        <Stack gap="lg">
           <Group justify="space-between">
              <Group>
                 <ThemeIcon variant="light" color={data.enabled ? 'teal' : 'gray'}>
                    {data.enabled ? <IconCheck size={20} /> : <IconX size={20} />}
                 </ThemeIcon>
                 <Stack gap={0}>
                    <Text fw={500}>DNS Integration</Text>
                    <Text size="sm" c="dimmed">
                       {data.enabled ? 'Enabled and active' : 'Disabled'}
                    </Text>
                 </Stack>
              </Group>
              <Badge 
                size="lg" 
                variant="light" 
                color={data.enabled ? 'teal' : 'gray'}
              >
                {data.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
           </Group>

           <TextInput
             label="Domain"
             value={data.domain || 'Not Configured'}
             readOnly
             variant="filled"
             description="The domain managed by this DNS configuration"
           />

           <TextInput
             label="Container ID"
             value={data.container_id || 'N/A'}
             readOnly
             variant="filled"
             description="The Docker container ID of the DNS instance"
             rightSection={
               data.container_id ? (
                 <ActionIcon 
                   component={Link} 
                   href={`/docker/${data.container_id}`}
                   variant="subtle" 
                   color="blue"
                   title="View Container"
                 >
                   <IconExternalLink size={16} />
                 </ActionIcon>
               ) : null
             }
           />

           <Stack gap="xs">
               <PasswordInput
                 label="DNS API Key"
                 placeholder="Enter API Key"
                 description="API Key for DNS management (e.g. Pi-hole API Token)"
                 value={apiKey}
                 onChange={(event) => setApiKey(event.currentTarget.value)}
               />
               <Group justify="flex-end">
                   <Button 
                     onClick={handleUpdateApiKey} 
                     loading={updating}
                     disabled={apiKey === (data.api_key || '')}
                   >
                     Update API Key
                   </Button>
               </Group>
           </Stack>

           {data.message && (
             <Paper withBorder p="sm" bg="gray.0">
               <Text size="sm"><Text span fw={700}>System Message:</Text> {data.message}</Text>
             </Paper>
           )}
        </Stack>
      </Paper>
    </Stack>
  );
}