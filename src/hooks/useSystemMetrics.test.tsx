import { renderHook, waitFor } from '@testing-library/react';
import { useSystemMetrics } from './useSystemMetrics';
import { vi, expect, test, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock the server action
vi.mock('@/actions/system-metrics', () => ({
  getSystemMetrics: vi.fn(),
}));

import { getSystemMetrics } from '@/actions/system-metrics';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test('useSystemMetrics fetches data on mount', async () => {
  const mockData = {
    cpu: { usage: 10, history: [] },
    memory: { usage: 20, total: 100, used: 20, history: [] },
    disk: { usage: 30, total: 100, used: 30, history: [] },
  };

  (getSystemMetrics as any).mockResolvedValue(mockData);

  const { result } = renderHook(() => useSystemMetrics());

  // Initially loading
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBeNull();

  // Wait for data
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual(mockData);
  expect(result.current.error).toBeNull();
});

test('useSystemMetrics handles error', async () => {
  (getSystemMetrics as any).mockRejectedValue(new Error('Fetch failed'));

  const { result } = renderHook(() => useSystemMetrics());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.error).toBe('Fetch failed');
});
