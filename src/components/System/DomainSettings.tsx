'use client';

import { useEffect, useState } from 'react';
import { 
  Title, 
  Paper, 
  TextInput, 
  Button, 
  Group, 
  Table, 
  LoadingOverlay, 
  Anchor,
  Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconExternalLink } from '@tabler/icons-react';
import type { DomainInfoResponse, IngressContainerInfo } from '@/lib/client';
import { getSystemDomain, updateSystemDomain } from '@/actions/system';

export function DomainSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<DomainInfoResponse | null>(null);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSystemDomain();
      setInfo(data);
      setDomain(data.domain);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load domain configuration',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.length < 3) {
      setError('Domain must be at least 3 characters');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateSystemDomain({ domain: domain });
      notifications.show({
        title: 'Success',
        message: 'Domain configuration updated',
        color: 'green',
        icon: <IconCheck size="1.1rem" />,
      });
      // Refresh data to get updated container URLs
      await loadData();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update domain configuration',
        color: 'red',
        icon: <IconAlertCircle size="1.1rem" />,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper p="md" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      
      <Title order={3} mb="md">Domain Configuration</Title>
      
      <form onSubmit={handleSubmit}>
        <Group align="flex-end" mb="lg">
          <TextInput
            label="System Domain"
            description="The base domain for accessing your services"
            placeholder="example.com"
            style={{ flex: 1 }}
            value={domain}
            onChange={(e) => setDomain(e.currentTarget.value)}
            error={error}
          />
          <Button type="submit" loading={saving}>Save Changes</Button>
        </Group>
      </form>

      <Title order={4} mb="sm" mt="xl">Accessible Containers</Title>
      
      {info?.containers && info.containers.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>URL</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {info.containers.map((container: IngressContainerInfo) => (
              <Table.Tr key={container.id}>
                <Table.Td>{container.name}</Table.Td>
                <Table.Td>
                  <Anchor href={container.url} target="_blank" rel="noopener noreferrer">
                    <Group gap={4}>
                      {container.url}
                      <IconExternalLink size={14} />
                    </Group>
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Alert color="blue" title="No public containers">
          There are currently no containers configured with ingress access on this domain.
        </Alert>
      )}
    </Paper>
  );
}
