import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

test('renders unique applications sorted by name', () => {
  const applications: IngressContainerInfo[] = [
    { id: '2', name: 'Zeta', url: 'https://zeta.example.com' },
    { id: '1', name: 'Alpha', url: 'https://alpha.example.com' },
    { id: '1', name: 'Alpha duplicate', url: 'https://duplicate.example.com' },
  ];

  renderWithMantine(<ApplicationsGrid applications={applications} />);

  const buttons = screen.getAllByRole('button', { name: /^Open / });
  expect(buttons).toHaveLength(2);

  expect(buttons[0].getAttribute('aria-label')).toBe('Open Alpha');
  expect(buttons[1].getAttribute('aria-label')).toBe('Open Zeta');
});

test('opens selected app in fullscreen modal and supports opening in new tab', () => {
  const applications: IngressContainerInfo[] = [
    { id: '1', name: 'Alpha', url: 'https://alpha.example.com' },
  ];
  const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

  renderWithMantine(<ApplicationsGrid applications={applications} />);

  fireEvent.click(screen.getByRole('button', { name: 'Open Alpha' }));

  expect(screen.getByText('Alpha')).toBeDefined();
  expect(screen.getByText('https://alpha.example.com')).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Open in new tab', hidden: true }));
  expect(windowOpenSpy).toHaveBeenCalledWith('https://alpha.example.com', '_blank', 'noopener,noreferrer');

  fireEvent.click(screen.getByRole('button', { name: 'Close application modal', hidden: true }));
  expect(screen.queryByText('https://alpha.example.com')).toBeNull();

  windowOpenSpy.mockRestore();
});
