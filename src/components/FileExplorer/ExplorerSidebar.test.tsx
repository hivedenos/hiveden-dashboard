import { MantineProvider } from '@mantine/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ExplorerSidebar } from './ExplorerSidebar';

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
      <ExplorerSidebar />
    </MantineProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExplorerSidebar', () => {
  test('renders bookmark management actions', async () => {
    const editBookmark = vi.fn();
    const removeBookmark = vi.fn();

    mockUseExplorer.mockReturnValue({
      navigateTo: vi.fn(),
      currentPath: '/workspace',
      homePath: '/workspace',
      bookmarks: [{ id: 7, name: 'Logs', path: '/workspace/logs' }],
      editBookmark,
      removeBookmark,
    });

    renderComponent();

    fireEvent.click(screen.getByLabelText('Manage bookmark Logs'));
    fireEvent.click(await screen.findByText('Rename'));
    expect(editBookmark).toHaveBeenCalledWith({ id: 7, name: 'Logs', path: '/workspace/logs' });

    fireEvent.click(screen.getByLabelText('Manage bookmark Logs'));
    fireEvent.click(await screen.findByText('Remove'));
    expect(removeBookmark).toHaveBeenCalledWith({ id: 7, name: 'Logs', path: '/workspace/logs' });
  });
});
