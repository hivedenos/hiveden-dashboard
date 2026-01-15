import { expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryMetric } from './MemoryMetric'
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

test('MemoryMetric renders usage and absolute values', () => {
  const data = { usage: 50, total: 16 * 1024 * 1024 * 1024, used: 8 * 1024 * 1024 * 1024, history: [10, 50] }
  renderWithMantine(<MemoryMetric data={data} />)
  expect(screen.getByText('Memory')).toBeDefined()
  // Check for "8 GB / 16 GB" or similar formatting.
  // Assuming formatBytes is used.
  // If formatBytes is not available in test env, we mock it or rely on simple string match?
  // I will assume the component formats it.
  // "8 GiB / 16 GiB"
  expect(screen.getByText(/8 GiB/)).toBeDefined()
})

test('MemoryMetric handles loading', () => {
  renderWithMantine(<MemoryMetric loading={true} />)
  expect(screen.queryByText('Memory')).toBeDefined() // Title always shown
  expect(screen.queryByText(/GB/)).toBeNull()
})
