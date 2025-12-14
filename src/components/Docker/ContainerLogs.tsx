'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Text, Stack, Group, Switch, NumberInput, Button, Code } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { getHttpBaseUrl } from '@/lib/shellClient';

interface ContainerLogsProps {
  containerId: string;
}

export function ContainerLogs({ containerId }: ContainerLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [follow, setFollow] = useState(true);
  const [tail, setTail] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (follow) {
      scrollToBottom();
    }
  }, [logs, follow]);

  const connectToLogs = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear logs
    setLogs([]);

    // Create new EventSource connection
    // Hardcoded to localhost:8000 as per original. Ideally should come from config.
    const baseUrl = getHttpBaseUrl();
    const url = `${baseUrl}/docker/containers/${containerId}/logs?follow=${follow}&tail=${tail}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const logLine = event.data;
      setLogs((prev) => [...prev, logLine]);
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  }, [containerId, follow, tail]);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState warning
    const timer = setTimeout(() => {
        connectToLogs();
    }, 0);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectToLogs]);

  const handleReconnect = () => {
    connectToLogs();
  };

  return (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="md">
            <Switch
              label="Follow logs"
              checked={follow}
              onChange={(event) => setFollow(event.currentTarget.checked)}
            />
            <NumberInput
              label="Tail lines"
              value={tail}
              onChange={(value) => setTail(Number(value) || 100)}
              min={1}
              max={10000}
              w={120}
            />
          </Group>
          <Group gap="xs">
            <Text size="sm" c={isConnected ? 'green' : 'red'}>
              {isConnected ? '● Connected' : '● Disconnected'}
            </Text>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={handleReconnect}
            >
              Reconnect
            </Button>
          </Group>
        </Group>

        <Code
          block
          style={{
            maxHeight: '600px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.5',
            backgroundColor: 'var(--mantine-color-dark-8)',
            color: 'var(--mantine-color-gray-0)',
            padding: '1rem',
          }}
        >
          {logs.length === 0 ? (
            <Text c="dimmed">Waiting for logs...</Text>
          ) : (
            <>
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </Code>
      </Card>
    </Stack>
  );
}