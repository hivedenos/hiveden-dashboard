import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { FileList } from './FileList';

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

vi.mock('./FileContextMenu', () => ({
  FileContextMenu: () => null,
}));

const baseItems = [
  {
    name: 'alpha.txt',
    path: '/alpha.txt',
    type: 'file',
    size: 12,
    size_human: '12 B',
    permissions: 'rw-r--r--',
    owner: 'root',
    group: 'root',
    modified: '2026-03-18T10:00:00Z',
    is_hidden: false,
    is_symlink: false,
  },
  {
    name: 'bravo.txt',
    path: '/bravo.txt',
    type: 'file',
    size: 24,
    size_human: '24 B',
    permissions: 'rw-r--r--',
    owner: 'root',
    group: 'root',
    modified: '2026-03-18T11:00:00Z',
    is_hidden: false,
    is_symlink: false,
  },
];

function renderComponent() {
  return render(
    <MantineProvider>
      <FileList />
    </MantineProvider>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('FileList', () => {
  test('arrow navigation updates selection to the next item', () => {
    const setSelection = vi.fn();

    mockUseExplorer.mockReturnValue({
      files: baseItems,
      folders: [],
      selectedItems: new Set<string>(),
      toggleSelection: vi.fn(),
      setSelection,
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
      isLoading: false,
      openEntry: vi.fn(),
      viewMode: 'list',
      error: null,
      submitRenameEntry: vi.fn(),
    });

    renderComponent();

    const firstRow = screen.getByText('alpha.txt').closest('tr');
    expect(firstRow).not.toBeNull();

    firstRow?.focus();
    fireEvent.keyDown(firstRow!, { key: 'ArrowDown' });

    expect(setSelection).toHaveBeenLastCalledWith(['/bravo.txt']);
  });

  test('shift navigation selects a range from the anchor', () => {
    const setSelection = vi.fn();

    mockUseExplorer.mockReturnValue({
      files: baseItems,
      folders: [],
      selectedItems: new Set<string>(),
      toggleSelection: vi.fn(),
      setSelection,
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
      isLoading: false,
      openEntry: vi.fn(),
      viewMode: 'list',
      error: null,
      submitRenameEntry: vi.fn(),
    });

    renderComponent();

    const [firstRow] = screen.getAllByRole('button');

    fireEvent.click(firstRow);
    fireEvent.keyDown(firstRow, { key: 'ArrowDown', shiftKey: true });

    expect(setSelection).toHaveBeenLastCalledWith(['/alpha.txt', '/bravo.txt']);
  });

  test('inline rename submits on Enter after F2', async () => {
    const submitRenameEntry = vi.fn().mockResolvedValue(undefined);

    mockUseExplorer.mockReturnValue({
      files: baseItems,
      folders: [],
      selectedItems: new Set<string>(['/alpha.txt']),
      toggleSelection: vi.fn(),
      setSelection: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
      isLoading: false,
      openEntry: vi.fn(),
      viewMode: 'list',
      error: null,
      submitRenameEntry,
    });

    renderComponent();

    const [firstRow] = screen.getAllByRole('button');

    firstRow.focus();
    fireEvent.keyDown(firstRow, { key: 'F2' });

    const input = screen.getByDisplayValue('alpha.txt');
    fireEvent.change(input, { target: { value: 'alpha-renamed.txt' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(submitRenameEntry).toHaveBeenCalledWith(baseItems[0], 'alpha-renamed.txt');
  });
});
