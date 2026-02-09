import { expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { SystemMetricsGrid } from './SystemMetricsGrid'
import { MantineProvider } from '@mantine/core'
import * as useHostMetricsModule from '@/hooks/useHostMetrics'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock useHostMetrics
vi.mock('@/hooks/useHostMetrics', () => ({
  useHostMetrics: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

function renderWithMantine(ui: React.ReactNode) {
  return render(
    <MantineProvider>{ui}</MantineProvider>
  )
}

test('SystemMetricsGrid renders all metrics', () => {
  // Mock return value
  const mockData = {
    cpuPercent: 10,
    memoryUsedBytes: 20,
    memoryTotalBytes: 100,
    memoryPercent: 20,
    networkRxBps: 1000,
    networkTxBps: 2000,
  };

  vi.mocked(useHostMetricsModule.useHostMetrics).mockReturnValue({
    data: mockData,
    loading: false,
    error: null
  });

  renderWithMantine(<SystemMetricsGrid />)

  expect(screen.getByText('CPU')).toBeDefined()
  expect(screen.getByText('RAM')).toBeDefined()
  expect(screen.getByText('Network')).toBeDefined()
  expect(screen.getByLabelText('Download')).toBeDefined()
  expect(screen.getByLabelText('Upload')).toBeDefined()
})

test('SystemMetricsGrid passes loading state', () => {
  vi.mocked(useHostMetricsModule.useHostMetrics).mockReturnValue({
    data: null,
    loading: true,
    error: null
  });

  renderWithMantine(<SystemMetricsGrid />)

  expect(screen.getByText('CPU')).toBeDefined()
  expect(screen.getByText('RAM')).toBeDefined()
  expect(screen.getByText('Network')).toBeDefined()
})
