import { render, screen } from '@testing-library/react';
import { BackupList } from './BackupList';
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

const mockSchedules = [
  { id: '1', type: 'database', target: 'postgres-schedule', cron: '0 0 * * *' }
];

const mockBackups = [
  { type: 'database', target: 'postgres-backup', timestamp: '2023-01-01T00:00:00Z', size: 1024, path: '/backups/db.sql', filename: 'db.sql', mtime: 123 }
];

test('BackupList renders schedules and history', () => {
  render(
    <MantineProvider>
      <BackupList schedules={mockSchedules} backups={mockBackups} />
    </MantineProvider>
  );

  // Schedules
  expect(screen.getByText('postgres-schedule')).toBeDefined();
  expect(screen.getByText('0 0 * * *')).toBeDefined();

  // History
  expect(screen.getByText('postgres-backup')).toBeDefined();
  expect(screen.getByText('1 KiB')).toBeDefined(); // Formatted size
});
