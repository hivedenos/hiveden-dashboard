import { render, screen } from '@testing-library/react';
import { Shell } from './Shell';
import { MantineProvider } from '@mantine/core';
import { vi, test, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock custom hook
vi.mock('@/lib/useApplicationVersion', () => ({
  useApplicationVersion: () => ({
    backendVersion: '1.0.0',
    frontendVersion: '1.0.0',
    isLoading: false,
  }),
}));

// Mock matchMedia
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
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
    cleanup();
});

test('Shell renders Backups navigation link', () => {
  render(
    <MantineProvider>
      <Shell>
        <div>Child Content</div>
      </Shell>
    </MantineProvider>
  );

  const backupsLink = screen.getByText('Backups');
  expect(backupsLink).toBeDefined();
});
