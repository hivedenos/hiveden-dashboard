import { expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CPUMetric } from './CPUMetric'
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

// Mock ResizeObserver for Recharts
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

test('CPUMetric renders usage and title', () => {
  const data = { usage: 45.5, history: [10, 20, 30, 45.5] }
  renderWithMantine(<CPUMetric data={data} />)
  expect(screen.getByText('CPU')).toBeDefined()
  expect(screen.getByText('46%')).toBeDefined() // Assuming rounding
})

test('CPUMetric handles loading', () => {
  renderWithMantine(<CPUMetric loading={true} />)
  expect(screen.queryByText('%')).toBeNull()
})
