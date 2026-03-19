import { MantineProvider } from '@mantine/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  cleanup();
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
      createFolder: vi.fn(),
      uploadFiles: vi.fn(),
      isUploading: false,
    });

    renderComponent();

    const [firstRow] = screen.getAllByLabelText('File item alpha.txt');

    firstRow.focus();
    fireEvent.keyDown(firstRow, { key: 'ArrowDown' });

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
      createFolder: vi.fn(),
      uploadFiles: vi.fn(),
      isUploading: false,
    });

    renderComponent();

    const [firstRow] = screen.getAllByLabelText('File item alpha.txt');

    fireEvent.click(firstRow);
    fireEvent.keyDown(firstRow, { key: 'ArrowDown', shiftKey: true });

    expect(setSelection).toHaveBeenLastCalledWith(['/alpha.txt', '/bravo.txt']);
  });

  test('per-item action trigger is rendered for keyboard-accessible actions', () => {
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
      submitRenameEntry: vi.fn(),
      createFolder: vi.fn(),
      uploadFiles: vi.fn(),
      isUploading: false,
    });

    renderComponent();

    expect(screen.getAllByLabelText('Open actions for alpha.txt').length).toBeGreaterThan(0);
  });

  test('empty state create folder action is available', () => {
    const createFolder = vi.fn();

    mockUseExplorer.mockReturnValue({
      files: [],
      folders: [],
      selectedItems: new Set<string>(),
      toggleSelection: vi.fn(),
      setSelection: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
      isLoading: false,
      openEntry: vi.fn(),
      viewMode: 'list',
      error: null,
      submitRenameEntry: vi.fn(),
      createFolder,
      uploadFiles: vi.fn(),
      isUploading: false,
    });

    renderComponent();

    fireEvent.click(screen.getByText('Create folder'));

    expect(createFolder).toHaveBeenCalled();
  });

  test('only one explorer item is tabbable at a time', () => {
    mockUseExplorer.mockReturnValue({
      files: baseItems,
      folders: [],
      selectedItems: new Set<string>(),
      toggleSelection: vi.fn(),
      setSelection: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
      isLoading: false,
      openEntry: vi.fn(),
      viewMode: 'list',
      error: null,
      submitRenameEntry: vi.fn(),
      createFolder: vi.fn(),
      uploadFiles: vi.fn(),
      isUploading: false,
    });

    renderComponent();

    expect(screen.getAllByLabelText('File item alpha.txt')[0].getAttribute('tabindex')).toBe('0');
    expect(screen.getAllByLabelText('File item bravo.txt')[0].getAttribute('tabindex')).toBe('-1');
  });

  test('drag and drop forwards files to upload handler', () => {
    const uploadFiles = vi.fn();

    mockUseExplorer.mockReturnValue({
      files: baseItems,
      folders: [],
      selectedItems: new Set<string>(),
      toggleSelection: vi.fn(),
      setSelection: vi.fn(),
      selectAll: vi.fn(),
      clearSelection: vi.fn(),
      isLoading: false,
      openEntry: vi.fn(),
      viewMode: 'list',
      error: null,
      submitRenameEntry: vi.fn(),
      createFolder: vi.fn(),
      uploadFiles,
      isUploading: false,
    });

    renderComponent();
    const [dropTarget] = screen.getAllByTestId('explorer-dropzone');
    const file = new File(['hello'], 'drop.txt', { type: 'text/plain' });

    fireEvent.drop(dropTarget, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(uploadFiles).toHaveBeenCalledWith([file]);
  });
});
