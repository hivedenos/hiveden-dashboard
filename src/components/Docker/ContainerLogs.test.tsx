import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ContainerLogs, parseLogLine } from './ContainerLogs';

vi.mock('@/lib/shellClient', () => ({
  getHttpBaseUrl: () => 'http://localhost:8000',
}));

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();
  url: string;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ContainerLogs', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    (global as unknown as { EventSource: typeof MockEventSource }).EventSource = MockEventSource;
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test('shows waiting state before logs arrive', async () => {
    render(
      <MantineProvider>
        <ContainerLogs containerId="abc123" />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Waiting for logs...')).toBeDefined();
    });
  });

  test('renders parsed row with severity pill and readable message', async () => {
    render(
      <MantineProvider>
        <ContainerLogs containerId="container-1" />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const stream = MockEventSource.instances[0];
    stream.onopen?.(new Event('open'));
    stream.onmessage?.({
      data: '2026-02-09T11:59:00Z ERROR: database connection failed',
    } as MessageEvent);

    await waitFor(() => {
      expect(screen.getByText('ERROR')).toBeDefined();
      expect(screen.getByText(/database connection failed/i)).toBeDefined();
      expect(screen.getByText(/ago|just now/)).toBeDefined();
    });
  });
});

describe('parseLogLine', () => {
  test('parses ISO timestamps and severity tokens', () => {
    const parsed = parseLogLine('2026-02-09T12:34:56Z [ERROR] Failed to start service', new Date('2026-02-09T12:35:56Z').getTime());

    expect(parsed.timestamp?.toISOString()).toBe('2026-02-09T12:34:56.000Z');
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('[ERROR] Failed to start service');
    expect(parsed.relativeTime).toBe('1m ago');
  });

  test('uses unknown level when no signal is present', () => {
    const parsed = parseLogLine('some plain line without obvious level');

    expect(parsed.timestamp).toBeNull();
    expect(parsed.level).toBe('unknown');
    expect(parsed.relativeTime).toBeNull();
  });

  test('infers warning level from heuristic keywords', () => {
    const parsed = parseLogLine('2026-02-09T12:00:00Z request timeout while waiting for upstream', new Date('2026-02-09T12:00:30Z').getTime());

    expect(parsed.level).toBe('warn');
    expect(parsed.relativeTime).toBe('30s ago');
  });

  test('parses embedded key-value time token', () => {
    const parsed = parseLogLine(
      'level=info msg="started http server" time=2026-02-09T07:55:14.738Z',
      new Date('2026-02-09T07:56:14.738Z').getTime()
    );

    expect(parsed.timestamp?.toISOString()).toBe('2026-02-09T07:55:14.738Z');
    expect(parsed.relativeTime).toBe('1m ago');
    expect(parsed.message).toBe('level=info msg="started http server"');
    expect(parsed.level).toBe('info');
  });
});
