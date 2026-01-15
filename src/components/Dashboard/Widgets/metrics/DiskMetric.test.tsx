import { expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { DiskMetric } from './DiskMetric'
import { MantineProvider } from '@mantine/core'

afterEach(() => {
  cleanup()
})

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

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function renderWithMantine(ui: React.ReactNode) {
  return render(
    <MantineProvider>{ui}</MantineProvider>
  )
}

test('DiskMetric renders usage and absolute values', () => {
  const data = { usage: 75, total: 500 * 1024 * 1024 * 1024, used: 375 * 1024 * 1024 * 1024, history: [70, 75] }
  renderWithMantine(<DiskMetric data={data} />)
  expect(screen.getByText('Disk')).toBeDefined()
  // "375 GiB / 500 GiB"
  expect(screen.getByText(/375 GiB/)).toBeDefined()
})

test('DiskMetric handles loading', () => {
  renderWithMantine(<DiskMetric loading={true} />)
  expect(screen.queryByText('Disk')).toBeDefined()
  expect(screen.queryByText(/GiB/)).toBeNull()
})
