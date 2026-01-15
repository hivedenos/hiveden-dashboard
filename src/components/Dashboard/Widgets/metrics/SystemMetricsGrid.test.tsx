import { expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { SystemMetricsGrid } from './SystemMetricsGrid'
import { MantineProvider } from '@mantine/core'
import * as useSystemMetricsModule from '@/hooks/useSystemMetrics'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock useSystemMetrics
vi.mock('@/hooks/useSystemMetrics', () => ({
  useSystemMetrics: vi.fn()
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
    cpu: { usage: 10, history: [] },
    memory: { usage: 20, total: 100, used: 20, history: [] },
    disk: { usage: 30, total: 100, used: 30, history: [] },
  };

  vi.mocked(useSystemMetricsModule.useSystemMetrics).mockReturnValue({
    data: mockData,
    loading: false,
    error: null
  });

  renderWithMantine(<SystemMetricsGrid />)

  expect(screen.getByText('CPU')).toBeDefined()
  expect(screen.getByText('Memory')).toBeDefined()
  expect(screen.getByText('Disk')).toBeDefined()
})

test('SystemMetricsGrid passes loading state', () => {
  vi.mocked(useSystemMetricsModule.useSystemMetrics).mockReturnValue({
    data: null,
    loading: true,
    error: null
  });

  renderWithMantine(<SystemMetricsGrid />)

  expect(screen.getByText('CPU')).toBeDefined()
  expect(screen.getByText('Memory')).toBeDefined()
  expect(screen.getByText('Disk')).toBeDefined()
})
