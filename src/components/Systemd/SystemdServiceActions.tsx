'use client';

import { useEffect, useState } from 'react';
import { 
  Paper, 
  Group, 
  Text, 
  Badge, 
  Button, 
  Loader, 
  ActionIcon, 
  Tooltip,
  Menu,
  rem
} from '@mantine/core';
import { 
  IconPlayerPlay, 
  IconPlayerStop, 
  IconRefresh, 
  IconSettings,
  IconCheck,
  IconX,
  IconAlertCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getService, manageService } from '@/actions/systemd';
import type { SystemdServiceStatus } from '@/lib/client';

interface SystemdServiceActionsProps {
  serviceName: string;
  title?: string;
}

export function SystemdServiceActions({ serviceName, title }: SystemdServiceActionsProps) {
  const [status, setStatus] = useState<SystemdServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = async (showError = false) => {
    try {
      const response = await getService(serviceName);
      if (response.data) {
        setStatus(response.data as SystemdServiceStatus);
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
      if (showError) {
          notifications.show({
              title: 'Error',
              message: 'Failed to fetch service status',
              color: 'red'
          });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 5000);
    return () => clearInterval(interval);
  }, [serviceName]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      await manageService(serviceName, action);
      notifications.show({
        title: 'Success',
        message: `Service ${action} command sent successfully`,
        color: 'green',
      });
      // Refresh status immediately
      await fetchStatus();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || `Failed to ${action} service`,
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !status) {
    return <Loader size="sm" />;
  }

  if (!status) {
      return <Text c="dimmed">Service not found: {serviceName}</Text>;
  }

  const isActive = status.active_state === 'active';
  const isEnabled = status.unit_file_state === 'enabled';

  return (
    <Paper p="sm" withBorder radius="md" mb="md">
      <Group justify="space-between">
        <Group>
            <Text fw={600}>{title || serviceName}</Text>
            <Badge 
                color={isActive ? 'green' : (status.active_state === 'failed' ? 'red' : 'gray')}
                variant="light"
            >
                {status.active_state} ({status.sub_state})
            </Badge>
            <Badge 
                color={isEnabled ? 'blue' : 'gray'}
                variant="outline"
            >
                {status.unit_file_state}
            </Badge>
        </Group>

        <Group gap="xs">
            {/* Mutually Exclusive Actions */}
            {!isActive && (
                <Tooltip label="Start Service">
                    <ActionIcon 
                        variant="light" 
                        color="green" 
                        onClick={() => handleAction('start')}
                        loading={actionLoading === 'start'}
                        disabled={!!actionLoading}
                    >
                        <IconPlayerPlay style={{ width: rem(18), height: rem(18) }} />
                    </ActionIcon>
                </Tooltip>
            )}

            {isActive && (
                <Tooltip label="Stop Service">
                    <ActionIcon 
                        variant="light" 
                        color="red" 
                        onClick={() => handleAction('stop')}
                        loading={actionLoading === 'stop'}
                        disabled={!!actionLoading}
                    >
                        <IconPlayerStop style={{ width: rem(18), height: rem(18) }} />
                    </ActionIcon>
                </Tooltip>
            )}

            <Tooltip label="Restart Service">
                <ActionIcon 
                    variant="light" 
                    color="blue" 
                    onClick={() => handleAction('restart')}
                    loading={actionLoading === 'restart'}
                    disabled={!!actionLoading}
                >
                    <IconRefresh style={{ width: rem(18), height: rem(18) }} />
                </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={200}>
                <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                        <IconSettings style={{ width: rem(18), height: rem(18) }} />
                    </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Label>Configuration</Menu.Label>
                    {!isEnabled && (
                        <Menu.Item 
                            leftSection={<IconCheck style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleAction('enable')}
                            disabled={!!actionLoading}
                        >
                            Enable on Boot
                        </Menu.Item>
                    )}
                    {isEnabled && (
                        <Menu.Item 
                            leftSection={<IconX style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleAction('disable')}
                            color="red"
                            disabled={!!actionLoading}
                        >
                            Disable on Boot
                        </Menu.Item>
                    )}
                </Menu.Dropdown>
            </Menu>
        </Group>
      </Group>
    </Paper>
  );
}
