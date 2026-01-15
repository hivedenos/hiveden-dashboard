import { expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MetricCard } from './MetricCard'
import { MantineProvider } from '@mantine/core'

afterEach(() => {
  cleanup()
})

// Mock matchMedia for Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
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

test('MetricCard renders title and children', () => {
  renderWithMantine(
    <MetricCard title="CPU Usage">
      <div>Chart Content</div>
    </MetricCard>
  )
  expect(screen.getByText('CPU Usage')).toBeDefined()
  expect(screen.getByText('Chart Content')).toBeDefined()
})

test('MetricCard renders loading skeleton', () => {
  renderWithMantine(
    <MetricCard title="CPU Usage" loading={true}>
      <div>Chart Content</div>
    </MetricCard>
  )
  // When loading, children should not be visible.
  expect(screen.queryByText('Chart Content')).toBeNull()
})

test('MetricCard renders error message', () => {
  renderWithMantine(
    <MetricCard title="CPU Usage" error="Failed to fetch">
      <div>Chart Content</div>
    </MetricCard>
  )
  expect(screen.getByText('Failed to fetch')).toBeDefined()
})