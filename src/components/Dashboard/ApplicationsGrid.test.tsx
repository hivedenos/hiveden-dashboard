import { cleanup, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { afterEach, expect, test, vi } from 'vitest';
import type { IngressContainerInfo } from '@/lib/client';
import { ApplicationsGrid } from './ApplicationsGrid';

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

afterEach(() => {
  cleanup();
});

function renderWithMantine(ui: React.ReactNode) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

test('renders empty state when no applications are available', () => {
  renderWithMantine(<ApplicationsGrid applications={[]} />);
  expect(screen.getByText('No applications available')).toBeDefined();
});

test('renders unique applications sorted by name with secure external links', () => {
  const applications: IngressContainerInfo[] = [
    { id: '2', name: 'Zeta', url: 'https://zeta.example.com' },
    { id: '1', name: 'Alpha', url: 'https://alpha.example.com' },
    { id: '1', name: 'Alpha duplicate', url: 'https://duplicate.example.com' },
  ];

  renderWithMantine(<ApplicationsGrid applications={applications} />);

  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(2);

  expect(links[0].getAttribute('aria-label')).toBe('Open Alpha');
  expect(links[1].getAttribute('aria-label')).toBe('Open Zeta');

  expect(links[0].getAttribute('href')).toBe('https://alpha.example.com');
  expect(links[0].getAttribute('target')).toBe('_blank');
  expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
});
