import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
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
  vi.clearAllMocks();
});

describe('ExplorerOperationsPanel', () => {
  test('renders empty state when no operations exist', () => {
    mockUseExplorer.mockReturnValue({
      operations: [],
      refresh: vi.fn(),
      dismissOperation: vi.fn(),
    });

    renderComponent();

    expect(screen.getByText('No recent activity')).toBeDefined();
  });

  test('renders operation details and dismisses an item', () => {
    const dismissOperation = vi.fn();

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
          created_at: '2026-03-18T12:00:00Z',
          updated_at: '2026-03-18T12:01:00Z',
        },
      ],
      refresh: vi.fn(),
      dismissOperation,
    });

    renderComponent();

    expect(screen.getByText('search files')).toBeDefined();
    expect(screen.getByText('5/10 items')).toBeDefined();
    expect(screen.getByText('Destination: /srv/data')).toBeDefined();

    fireEvent.click(screen.getByLabelText('Dismiss search_files operation'));

    expect(dismissOperation).toHaveBeenCalledWith('op-1');
  });
});
