import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupForm } from './BackupForm';
import { MantineProvider } from '@mantine/core';
import { expect, test, vi } from 'vitest';

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
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

test('BackupForm renders fields', () => {
  render(
    <MantineProvider>
      <BackupForm onSubmit={vi.fn()} />
    </MantineProvider>
  );

  expect(screen.getByText('Backup Type')).toBeDefined();
  expect(screen.getByLabelText('Schedule (Cron)')).toBeDefined();
});

test('BackupForm validates required fields', async () => {
  const onSubmit = vi.fn();
  render(
    <MantineProvider>
      <BackupForm onSubmit={onSubmit} />
    </MantineProvider>
  );

  const submitButton = screen.getAllByRole('button', { name: /Save Backup/i })[0];
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
