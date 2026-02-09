import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, test, vi } from 'vitest';
import { MetricsSettings } from './MetricsSettings';

vi.mock('@/actions/system', () => ({
  getMetricsConfig: vi.fn(),
}));

vi.mock('@/lib/prometheus', () => ({
  resolvePrometheusUrl: vi.fn(() => 'http://prometheus.example.com'),
}));

import { getMetricsConfig } from '@/actions/system';

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

describe('MetricsSettings', () => {
  test('renders metrics host and dependency containers', async () => {
    vi.mocked(getMetricsConfig).mockResolvedValue({
      status: 'success',
      host: 'http://prometheus.internal:9090',
      dependencies: {
        containers: ['prometheus', 'node-exporter'],
      },
    });

    render(
      <MantineProvider>
        <MetricsSettings />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Metrics Configuration')).toBeDefined();
      expect(screen.getByText('prometheus')).toBeDefined();
      expect(screen.getByText('node-exporter')).toBeDefined();
      expect(screen.getByText('Resolved Endpoint')).toBeDefined();
    });
  });
});
