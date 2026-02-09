'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Card, Text, Stack, Group, Switch, NumberInput, Button, Badge, Box } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { getHttpBaseUrl } from '@/lib/shellClient';

interface ContainerLogsProps {
  containerId: string;
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'success' | 'unknown';

interface ParsedLogLine {
  raw: string;
  message: string;
  timestamp: Date | null;
  exactTimestamp: string | null;
  relativeTime: string | null;
  level: LogLevel;
  sourceTag: string | null;
}

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  error: 'red',
  warn: 'orange',
  info: 'blue',
  debug: 'gray',
  trace: 'grape',
  success: 'green',
  unknown: 'gray',
};

const ISO_TIMESTAMP_PREFIX = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)\s*(.*)$/;
const SPACE_TIMESTAMP_PREFIX = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:[.,]\d{3})?)\s*(.*)$/;
const KEY_VALUE_TIME = /(?:^|\s)time=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))/;
const SERVICE_TAG_PREFIX = /^([a-z0-9][a-z0-9_.-]{1,40})\s+\|\s+(.*)$/i;

function normalizeLevelToken(token: string): LogLevel {
  const value = token.toLowerCase();
  if (value === 'error' || value === 'err' || value === 'fatal') return 'error';
  if (value === 'warn' || value === 'warning') return 'warn';
  if (value === 'info') return 'info';
  if (value === 'debug') return 'debug';
  if (value === 'trace') return 'trace';
  return 'unknown';
}

function detectLevel(rawLine: string, message: string): LogLevel {
  const levelField = `${rawLine} ${message}`.match(/\b(?:level|lvl|severity)=(error|err|fatal|warn|warning|info|debug|trace)\b/i);
  if (levelField?.[1]) {
    return normalizeLevelToken(levelField[1]);
  }

  const explicit = `${rawLine} ${message}`.match(/(?:^|\s|\[)(error|err|fatal|warn|warning|info|debug|trace)(?:\]|\s|:|=)/i);
  if (explicit?.[1]) {
    return normalizeLevelToken(explicit[1]);
  }

  const lowerMessage = message.toLowerCase();

  if (/\b(panic|exception|failed|failure|crash|cannot|denied|unreachable)\b/.test(lowerMessage)) {
    return 'error';
  }
  if (/\b(timeout|slow|retry|deprecated|warning)\b/.test(lowerMessage)) {
    return 'warn';
  }
  if (/\b(started|ready|listening|connected|healthy|success)\b/.test(lowerMessage)) {
    return 'success';
  }
  if (/\b(debug)\b/.test(lowerMessage)) {
    return 'debug';
  }
  if (/\b(trace)\b/.test(lowerMessage)) {
    return 'trace';
  }
  if (/\b(info)\b/.test(lowerMessage)) {
    return 'info';
  }

  return 'unknown';
}

function parseTimestamp(line: string): { timestamp: Date | null; message: string } {
  const isoMatch = line.match(ISO_TIMESTAMP_PREFIX);
  if (isoMatch) {
    const parsed = new Date(isoMatch[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return { timestamp: parsed, message: isoMatch[2]?.trim() || '' };
    }
  }

  const spacedMatch = line.match(SPACE_TIMESTAMP_PREFIX);
  if (spacedMatch) {
    const normalized = spacedMatch[1].replace(' ', 'T').replace(',', '.');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return { timestamp: parsed, message: spacedMatch[2]?.trim() || '' };
    }
  }

  const kvTimeMatch = line.match(KEY_VALUE_TIME);
  if (kvTimeMatch) {
    const parsed = new Date(kvTimeMatch[1]);
    if (!Number.isNaN(parsed.getTime())) {
      const messageWithoutTime = line.replace(kvTimeMatch[0], ' ').replace(/\s{2,}/g, ' ').trim();
      return { timestamp: parsed, message: messageWithoutTime };
    }
  }

  return { timestamp: null, message: line };
}

export function formatRelativeTime(timestamp: Date, nowMs = Date.now()): string {
  const deltaSeconds = Math.max(0, Math.floor((nowMs - timestamp.getTime()) / 1000));

  if (deltaSeconds < 5) return 'just now';
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;

  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function parseLogLine(line: string, nowMs = Date.now()): ParsedLogLine {
  const serviceTagMatch = line.match(SERVICE_TAG_PREFIX);
  const sourceTag = serviceTagMatch?.[1] || null;
  const sourceTrimmedLine = serviceTagMatch?.[2] || line;

  const { timestamp, message } = parseTimestamp(sourceTrimmedLine);
  const cleanMessage = message.trim() || sourceTrimmedLine.trim();
  const level = detectLevel(line, cleanMessage);

  return {
    raw: line,
    message: cleanMessage,
    timestamp,
    exactTimestamp: timestamp ? timestamp.toLocaleString() : null,
    relativeTime: timestamp ? formatRelativeTime(timestamp, nowMs) : null,
    level,
    sourceTag,
  };
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

  const parsedLogs = useMemo(() => {
    const nowMs = Date.now();
    return logs.map((line) => parseLogLine(line, nowMs));
  }, [logs]);

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

        <Box
          style={{
            maxHeight: '600px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            backgroundColor: 'var(--mantine-color-body)',
            color: 'var(--mantine-color-text)',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          {logs.length === 0 ? (
            <Text c="dimmed" p="md">
              Waiting for logs...
            </Text>
          ) : (
            <>
              {parsedLogs.map((log, index) => (
                <Group
                  key={`${index}-${log.raw.slice(0, 24)}`}
                  align="flex-start"
                  wrap="nowrap"
                  gap="sm"
                  p="sm"
                  style={{
                    borderBottom: index < parsedLogs.length - 1 ? '1px solid var(--mantine-color-default-border)' : 'none',
                    backgroundColor: index % 2 === 0 ? 'var(--mantine-color-body)' : 'var(--mantine-color-default-hover)',
                  }}
                >
                  <Stack gap={2} style={{ minWidth: 112 }}>
                    <Text size="xs" c={log.timestamp ? 'dimmed' : 'gray'}>
                      {log.relativeTime || '--'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {log.exactTimestamp || 'No timestamp'}
                    </Text>
                  </Stack>

                  <Badge
                    color={LOG_LEVEL_COLORS[log.level]}
                    variant="light"
                    size="sm"
                    style={{ minWidth: 76, textAlign: 'center' }}
                  >
                    {log.level.toUpperCase()}
                  </Badge>

                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    {log.sourceTag && (
                      <Text size="xs" c="dimmed">
                        {log.sourceTag}
                      </Text>
                    )}
                    <Text
                      size="sm"
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.message}
                    </Text>
                  </Stack>
                </Group>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </Box>
      </Card>
    </Stack>
  );
}
