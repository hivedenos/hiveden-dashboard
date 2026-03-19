import { MantineProvider } from '@mantine/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ExplorerOperationsPanel } from './ExplorerOperationsPanel';

const mockUseExplorer = vi.fn();

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

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('./ExplorerProvider', () => ({
  useExplorer: () => mockUseExplorer(),
}));

function renderComponent() {
  return render(
    <MantineProvider>
      <ExplorerOperationsPanel compact />
    </MantineProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExplorerOperationsPanel', () => {
  test('renders empty state when no operations exist', () => {
    mockUseExplorer.mockReturnValue({
      operations: [],
      refreshOperations: vi.fn(),
      cancelOperation: vi.fn(),
      retryOperation: vi.fn(),
      dismissOperation: vi.fn(),
    });

    renderComponent();

    expect(screen.getByText('No recent activity')).toBeDefined();
  });

  test('renders operation details and dismisses an item', () => {
    const dismissOperation = vi.fn();
    const cancelOperation = vi.fn();
    const retryOperation = vi.fn();

    const refreshOperations = vi.fn();
    mockUseExplorer.mockReturnValue({
      operations: [
        {
          id: 'op-1',
          operation_type: 'search_files',
          status: 'in_progress',
          progress: 50,
          total_items: 10,
          processed_items: 5,
          destination_path: '/srv/data',
          error_message: null,
          result: {
            uploaded_bytes: 512,
            total_bytes: 1024,
            summary: { processed_items: 5, total_items: 10, created: 1, skipped: 1 },
            files: [
              {
                name: 'alpha.txt',
                size: 1024,
                uploaded_bytes: 512,
                progress: 50,
                status: 'in_progress',
                error_message: null,
                result: { outcome: 'created' },
              },
            ],
          },
          created_at: '2026-03-18T12:00:00Z',
          updated_at: '2026-03-18T12:01:00Z',
        },
        {
          id: 'op-2',
          operation_type: 'upload_files',
          status: 'failed',
          progress: 60,
          total_items: 2,
          processed_items: 1,
          destination_path: '/srv/data',
          error_message: 'Network issue',
          result: {
            uploaded_bytes: 1024,
            total_bytes: 2048,
            summary: { processed_items: 1, total_items: 2, failed: 1 },
            files: [],
          },
          created_at: '2026-03-18T12:00:00Z',
          updated_at: '2026-03-18T12:03:00Z',
        },
      ],
      refreshOperations,
      cancelOperation,
      retryOperation,
      dismissOperation,
    });

    renderComponent();

    expect(screen.getByText('search files')).toBeDefined();
    expect(screen.getByText('5/10 items')).toBeDefined();
    expect(screen.getAllByText('Destination: /srv/data').length).toBeGreaterThan(0);
    expect(screen.getAllByText('512 B / 1.0 KB').length).toBeGreaterThan(0);
    expect(screen.getByText('alpha.txt')).toBeDefined();
    expect(screen.getByText('1 created')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Cancel search_files operation'));
    expect(cancelOperation).toHaveBeenCalledWith('op-1');

    fireEvent.click(screen.getByLabelText('Retry upload_files operation'));
    expect(retryOperation).toHaveBeenCalledWith('op-2');

    fireEvent.click(screen.getByLabelText('Dismiss search_files operation'));

    expect(dismissOperation).toHaveBeenCalledWith('op-1');

    fireEvent.click(screen.getByLabelText('Refresh operations'));
    expect(refreshOperations).toHaveBeenCalled();
  });
});
