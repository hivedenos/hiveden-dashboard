import { MantineProvider } from '@mantine/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ExplorerToolbar } from './ExplorerToolbar';

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
      <ExplorerToolbar onToggleOperations={vi.fn()} onToggleSidebar={vi.fn()} />
    </MantineProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ExplorerToolbar', () => {
  test('updates advanced search options', () => {
    vi.useFakeTimers();
    const performSearch = vi.fn();
    const setSearchOptions = vi.fn();

    mockUseExplorer.mockReturnValue({
      currentPath: '/workspace',
      navigateBack: vi.fn(),
      navigateForward: vi.fn(),
      navigateUp: vi.fn(),
      navigateTo: vi.fn(),
      viewMode: 'list',
      setViewMode: vi.fn(),
      historyIndex: 0,
      history: ['/workspace'],
      toggleHidden: vi.fn(),
      showHidden: false,
      setSort: vi.fn(),
      sortBy: 'name',
      sortOrder: 'asc',
      performSearch,
      clearSearch: vi.fn(),
      isSearching: false,
      createFolder: vi.fn(),
      uploadFiles: vi.fn(),
      isUploading: false,
      searchOptions: { use_regex: false, case_sensitive: false, type_filter: 'all' },
      setSearchOptions,
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText('Search files'), { target: { value: 'logs' } });
    vi.advanceTimersByTime(350);
    fireEvent.click(screen.getByLabelText('Search options'));
    fireEvent.click(screen.getByLabelText('Regex'));

    expect(performSearch).toHaveBeenCalledWith('logs', { use_regex: false, case_sensitive: false, type_filter: 'all' });
    expect(setSearchOptions).toHaveBeenCalledWith({ use_regex: true, case_sensitive: false, type_filter: 'all' });

    vi.useRealTimers();
  });

  test('file picker forwards selected files to upload handler', () => {
    const uploadFiles = vi.fn();

    mockUseExplorer.mockReturnValue({
      currentPath: '/workspace',
      navigateBack: vi.fn(),
      navigateForward: vi.fn(),
      navigateUp: vi.fn(),
      navigateTo: vi.fn(),
      viewMode: 'list',
      setViewMode: vi.fn(),
      historyIndex: 0,
      history: ['/workspace'],
      toggleHidden: vi.fn(),
      showHidden: false,
      setSort: vi.fn(),
      sortBy: 'name',
      sortOrder: 'asc',
      performSearch: vi.fn(),
      clearSearch: vi.fn(),
      isSearching: false,
      createFolder: vi.fn(),
      uploadFiles,
      isUploading: false,
      searchOptions: { use_regex: false, case_sensitive: false, type_filter: 'all' },
      setSearchOptions: vi.fn(),
    });

    const { container } = renderComponent();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(uploadFiles).toHaveBeenCalledWith([file]);
  });
});
