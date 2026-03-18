import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Code, Divider, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import {
  clearClipboard,
  copyItems,
  createBookmark,
  cutItems,
  deleteItems,
  deleteOperation,
  getClipboardStatus,
  getCurrentWorkingDirectory,
  getOperationStatus,
  getProperties,
  listBookmarks,
  listDirectory,
  listOperations,
  pasteItems,
  renameItem,
  searchFiles,
} from '@/actions/explorer';
import { ClipboardStatusResponse, ExplorerOperation, FileEntry, SortBy, SortOrder } from '@/lib/client';

type ViewMode = 'list' | 'grid';

type BookmarkItem = {
  id?: number;
  name: string;
  path: string;
};

type RenameDialogState = {
  opened: boolean;
  entry: FileEntry | null;
  value: string;
  isSubmitting: boolean;
};

type BookmarkDialogState = {
  opened: boolean;
  entry: FileEntry | null;
  value: string;
  isSubmitting: boolean;
};

type DeleteDialogState = {
  opened: boolean;
  paths: string[];
  isSubmitting: boolean;
};

type PropertiesDialogState = {
  opened: boolean;
  path: string | null;
  entry: FileEntry | null;
  isLoading: boolean;
};

interface ExplorerState {
  currentPath: string;
  files: FileEntry[];
  folders: FileEntry[];
  isLoading: boolean;
  error: string | null;
  selectedItems: Set<string>;
  history: string[];
  historyIndex: number;
  viewMode: ViewMode;
  showHidden: boolean;
  sortBy: SortBy;
  sortOrder: SortOrder;
  isSearching: boolean;
  searchQuery: string;
  homePath: string;
  bookmarks: BookmarkItem[];
  clipboardStatus: ClipboardStatusResponse | null;
  operations: ExplorerOperation[];
}

interface ExplorerContextType extends ExplorerState {
  navigateTo: (path: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateUp: () => void;
  refresh: () => void;
  toggleSelection: (path: string, multi?: boolean) => void;
  clearSelection: () => void;
  setSelection: (paths: string[]) => void;
  selectAll: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleHidden: () => void;
  setSort: (by: SortBy, order: SortOrder) => void;
  performSearch: (query: string) => void;
  clearSearch: () => void;
  openEntry: (entry: FileEntry) => void;
  copySelection: (paths?: string[]) => Promise<void>;
  cutSelection: (paths?: string[]) => Promise<void>;
  pasteIntoCurrentPath: () => Promise<void>;
  renameEntryByPath: (entry: FileEntry) => Promise<void>;
  submitRenameEntry: (entry: FileEntry, nextName: string) => Promise<void>;
  deleteSelection: (paths?: string[]) => Promise<void>;
  showPropertiesForPath: (path: string) => Promise<void>;
  addBookmarkForEntry: (entry: FileEntry) => Promise<void>;
  clearClipboardContents: () => Promise<void>;
  dismissOperation: (operationId: string) => Promise<void>;
}

const ExplorerContext = createContext<ExplorerContextType | null>(null);

function getSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `explorer-${Date.now()}`;
}

function normalizeBookmarks(input: unknown): BookmarkItem[] {
  const candidates = Array.isArray(input)
    ? input
    : typeof input === 'object' && input !== null
      ? (input as { bookmarks?: unknown; locations?: unknown; items?: unknown; data?: unknown }).bookmarks ??
        (input as { locations?: unknown }).locations ??
        (input as { items?: unknown }).items ??
        (input as { data?: unknown }).data
      : [];

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { id?: number; name?: string; path?: string };

      if (!candidate.path || !candidate.name) {
        return null;
      }

      return {
        id: candidate.id,
        name: candidate.name,
        path: candidate.path,
      } as BookmarkItem;
    })
    .filter((item): item is BookmarkItem => item !== null);
}

function buildChildPath(currentPath: string, name: string) {
  return currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
}

function getParentPath(path: string) {
  return path.split('/').slice(0, -1).join('/') || '/';
}

export const useExplorer = () => {
  const context = useContext(ExplorerContext);

  if (!context) {
    throw new Error('useExplorer must be used within an ExplorerProvider');
  }

  return context;
};

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState('/');
  const [homePath, setHomePath] = useState('/');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folders, setFolders] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.NAME);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.ASC);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [preSearchFiles, setPreSearchFiles] = useState<FileEntry[]>([]);
  const [preSearchFolders, setPreSearchFolders] = useState<FileEntry[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [clipboardStatus, setClipboardStatus] = useState<ClipboardStatusResponse | null>(null);
  const [operations, setOperations] = useState<ExplorerOperation[]>([]);
  const [clipboardSessionId] = useState(getSessionId);
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    opened: false,
    entry: null,
    value: '',
    isSubmitting: false,
  });
  const [bookmarkDialog, setBookmarkDialog] = useState<BookmarkDialogState>({
    opened: false,
    entry: null,
    value: '',
    isSubmitting: false,
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    opened: false,
    paths: [],
    isSubmitting: false,
  });
  const [propertiesDialog, setPropertiesDialog] = useState<PropertiesDialogState>({
    opened: false,
    path: null,
    entry: null,
    isLoading: false,
  });

  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeOperationIdRef = useRef<string | null>(null);

  const allEntries = useMemo(() => [...folders, ...files], [files, folders]);
  const entryNameByPath = useMemo(() => new Map(allEntries.map((entry) => [entry.path, entry.name])), [allEntries]);

  const stopSearchPolling = useCallback(() => {
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }

    activeOperationIdRef.current = null;
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      const result = await listBookmarks();
      setBookmarks(normalizeBookmarks(result));
    } catch {
      setBookmarks([]);
    }
  }, []);

  const loadClipboard = useCallback(async () => {
    try {
      const status = await getClipboardStatus(clipboardSessionId);
      setClipboardStatus(status);
    } catch {
      setClipboardStatus(null);
    }
  }, [clipboardSessionId]);

  const loadOperations = useCallback(async () => {
    try {
      const result = await listOperations(8);
      setOperations(result);
    } catch {
      setOperations([]);
    }
  }, []);

  const loadDirectory = useCallback(
    async (path: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await listDirectory(path, sortBy, sortOrder, showHidden);
        const entries = data?.entries ?? [];
        setFiles(entries.filter((entry) => entry.type === 'file'));
        setFolders(entries.filter((entry) => entry.type === 'directory'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load directory';
        setError(message);
        notifications.show({ title: 'Error', message, color: 'red' });
      } finally {
        setIsLoading(false);
      }
    },
    [showHidden, sortBy, sortOrder],
  );

  useEffect(() => {
    let mounted = true;

    async function loadInitialState() {
      try {
        const result = await getCurrentWorkingDirectory();
        const nextPath = typeof result?.cwd === 'string' && result.cwd ? result.cwd : '/';

        if (!mounted) {
          return;
        }

        setHomePath(nextPath);
        setCurrentPath(nextPath);
        setHistory([nextPath]);
        setHistoryIndex(0);
      } catch {
        if (mounted) {
          setHomePath('/');
        }
      }
    }

    void loadInitialState();
    void loadBookmarks();
    void loadClipboard();
    void loadOperations();

    return () => {
      mounted = false;
      stopSearchPolling();
    };
  }, [loadBookmarks, loadClipboard, loadOperations, stopSearchPolling]);

  useEffect(() => {
    void loadOperations();

    const intervalId = setInterval(() => {
      void loadOperations();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [loadOperations]);

  useEffect(() => {
    if (!isSearching) {
      void loadDirectory(currentPath);
    }
  }, [currentPath, isSearching, loadDirectory]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const setSelection = useCallback((paths: string[]) => {
    setSelectedItems(new Set(paths));
  }, []);

  const navigateTo = useCallback((path: string) => {
    if (!path || path === currentPath) {
      return;
    }

    if (isSearching) {
      stopSearchPolling();
      setIsSearching(false);
      setSearchQuery('');
      setPreSearchFiles([]);
      setPreSearchFolders([]);
    }

    setHistory((previous) => {
      const nextHistory = previous.slice(0, historyIndex + 1);
      nextHistory.push(path);
      setHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });

    setCurrentPath(path);
    clearSelection();
  }, [clearSelection, currentPath, historyIndex, isSearching, stopSearchPolling]);

  const navigateBack = useCallback(() => {
    if (historyIndex <= 0) {
      return;
    }

    if (isSearching) {
      stopSearchPolling();
      setIsSearching(false);
      setSearchQuery('');
    }

    setHistoryIndex((previous) => previous - 1);
    setCurrentPath(history[historyIndex - 1]);
    clearSelection();
  }, [clearSelection, history, historyIndex, isSearching, stopSearchPolling]);

  const navigateForward = useCallback(() => {
    if (historyIndex >= history.length - 1) {
      return;
    }

    if (isSearching) {
      stopSearchPolling();
      setIsSearching(false);
      setSearchQuery('');
    }

    setHistoryIndex((previous) => previous + 1);
    setCurrentPath(history[historyIndex + 1]);
    clearSelection();
  }, [clearSelection, history, historyIndex, isSearching, stopSearchPolling]);

  const navigateUp = useCallback(() => {
    if (currentPath === '/') {
      return;
    }

    navigateTo(getParentPath(currentPath));
  }, [currentPath, navigateTo]);

  const toggleSelection = useCallback((path: string, multi = false) => {
    setSelectedItems((previous) => {
      const next = new Set(multi ? previous : []);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(allEntries.map((entry) => entry.path)));
  }, [allEntries]);

  const toggleHidden = useCallback(() => {
    setShowHidden((previous) => !previous);
  }, []);

  const setSort = useCallback((by: SortBy, order: SortOrder) => {
    setSortBy(by);
    setSortOrder(order);
  }, []);

  const clearSearch = useCallback(() => {
    stopSearchPolling();
    setIsSearching(false);
    setSearchQuery('');
    setFiles(preSearchFiles);
    setFolders(preSearchFolders);
    setPreSearchFiles([]);
    setPreSearchFolders([]);
  }, [preSearchFiles, preSearchFolders, stopSearchPolling]);

  const performSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      clearSearch();
      return;
    }

    stopSearchPolling();

    if (!isSearching) {
      setPreSearchFiles(files);
      setPreSearchFolders(folders);
      setIsSearching(true);
    }

    setSearchQuery(trimmedQuery);
    setIsLoading(true);
    setError(null);

    try {
      const { operation_id } = await searchFiles({
        path: currentPath,
        pattern: trimmedQuery,
        show_hidden: showHidden,
      });

      if (!operation_id) {
        throw new Error('Failed to start search operation');
      }

      activeOperationIdRef.current = operation_id;

      searchIntervalRef.current = setInterval(async () => {
        if (!activeOperationIdRef.current || activeOperationIdRef.current !== operation_id) {
          return;
        }

        try {
          const response = await getOperationStatus(operation_id);
          const operation = response.operation;

          if (operation.status === 'completed') {
            stopSearchPolling();
            setIsLoading(false);

            if (!operation.result) {
              setFiles([]);
              setFolders([]);
              return;
            }

            const parsedResult = JSON.parse(operation.result);
            const entries = (parsedResult.matches || parsedResult) as FileEntry[];

            if (Array.isArray(entries)) {
              setFiles(entries.filter((entry) => entry.type === 'file'));
              setFolders(entries.filter((entry) => entry.type === 'directory'));
            } else {
              setFiles([]);
              setFolders([]);
            }

            clearSelection();
          } else if (operation.status === 'failed' || operation.status === 'cancelled') {
            stopSearchPolling();
            setIsLoading(false);
            throw new Error(operation.error_message || 'Search operation failed');
          }
        } catch (pollError) {
          stopSearchPolling();
          setIsLoading(false);

          const message = pollError instanceof Error ? pollError.message : 'Error checking search status';
          setError(message);
          notifications.show({ title: 'Search Error', message, color: 'red' });
        }
      }, 1000);
    } catch (err) {
      stopSearchPolling();
      setIsLoading(false);

      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      notifications.show({ title: 'Search Error', message, color: 'red' });
    }
  }, [clearSearch, clearSelection, currentPath, files, folders, isSearching, showHidden, stopSearchPolling]);

  const refresh = useCallback(() => {
    void loadBookmarks();
    void loadClipboard();
    void loadOperations();

    if (isSearching) {
      void performSearch(searchQuery);
      return;
    }

    void loadDirectory(currentPath);
  }, [currentPath, isSearching, loadBookmarks, loadClipboard, loadDirectory, loadOperations, performSearch, searchQuery]);

  const openEntry = useCallback((entry: FileEntry) => {
    if (entry.type === 'directory') {
      navigateTo(entry.path || buildChildPath(currentPath, entry.name));
      return;
    }

    window.open(`/explorer/download?path=${encodeURIComponent(entry.path)}`, '_blank', 'noopener,noreferrer');
  }, [currentPath, navigateTo]);

  const runClipboardAction = useCallback(async (paths: string[], mode: 'copy' | 'cut') => {
    const uniquePaths = Array.from(new Set(paths));

    if (uniquePaths.length === 0) {
      return;
    }

    try {
      if (mode === 'copy') {
        await copyItems({ session_id: clipboardSessionId, paths: uniquePaths });
      } else {
        await cutItems({ session_id: clipboardSessionId, paths: uniquePaths });
      }

      await Promise.all([loadClipboard(), loadOperations()]);
      notifications.show({
        title: mode === 'copy' ? 'Copied' : 'Cut',
        message: `${uniquePaths.length} item${uniquePaths.length === 1 ? '' : 's'} ready to paste`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Clipboard Error',
        message: err instanceof Error ? err.message : `Failed to ${mode} items`,
        color: 'red',
      });
    }
  }, [clipboardSessionId, loadClipboard, loadOperations]);

  const copySelection = useCallback(async (paths?: string[]) => {
    await runClipboardAction(paths ?? Array.from(selectedItems), 'copy');
  }, [runClipboardAction, selectedItems]);

  const cutSelection = useCallback(async (paths?: string[]) => {
    await runClipboardAction(paths ?? Array.from(selectedItems), 'cut');
  }, [runClipboardAction, selectedItems]);

  const pasteIntoCurrentPath = useCallback(async () => {
    try {
      await pasteItems({ session_id: clipboardSessionId, destination: currentPath });
      await Promise.all([loadClipboard(), loadDirectory(currentPath), loadOperations()]);
      clearSelection();
      notifications.show({
        title: 'Paste complete',
        message: `Items pasted into ${currentPath}`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Paste failed',
        message: err instanceof Error ? err.message : 'Failed to paste items',
        color: 'red',
      });
    }
  }, [clearSelection, clipboardSessionId, currentPath, loadClipboard, loadDirectory, loadOperations]);

  const renameEntryByPath = useCallback(async (entry: FileEntry) => {
    setRenameDialog({ opened: true, entry, value: entry.name, isSubmitting: false });
  }, []);

  const submitRenameEntry = useCallback(async (entry: FileEntry, nextName: string) => {
    const trimmedName = nextName.trim();

    if (!trimmedName || trimmedName === entry.name) {
      return;
    }

    await renameItem({
      source: entry.path,
      destination: buildChildPath(getParentPath(entry.path), trimmedName),
    });
    await Promise.all([loadBookmarks(), loadDirectory(currentPath), loadOperations()]);
    clearSelection();
    notifications.show({
      title: 'Renamed',
      message: `${entry.name} renamed to ${trimmedName}`,
      color: 'green',
    });
  }, [clearSelection, currentPath, loadBookmarks, loadDirectory, loadOperations]);

  const deleteSelection = useCallback(async (paths?: string[]) => {
    const targets = Array.from(new Set(paths ?? Array.from(selectedItems)));

    if (targets.length === 0) {
      return;
    }

    setDeleteDialog({ opened: true, paths: targets, isSubmitting: false });
  }, [selectedItems]);

  const showPropertiesForPath = useCallback(async (path: string) => {
    setPropertiesDialog({ opened: true, path, entry: null, isLoading: true });

    try {
      const response = await getProperties(path);
      setPropertiesDialog({ opened: true, path, entry: response.entry, isLoading: false });
    } catch (err) {
      setPropertiesDialog({ opened: false, path: null, entry: null, isLoading: false });
      notifications.show({
        title: 'Properties unavailable',
        message: err instanceof Error ? err.message : 'Failed to load file properties',
        color: 'red',
      });
    }
  }, []);

  const addBookmarkForEntry = useCallback(async (entry: FileEntry) => {
    setBookmarkDialog({ opened: true, entry, value: entry.name, isSubmitting: false });
  }, []);

  const clearClipboardContents = useCallback(async () => {
    try {
      await clearClipboard(clipboardSessionId);
      await loadClipboard();
    } catch (err) {
      notifications.show({
        title: 'Clipboard Error',
        message: err instanceof Error ? err.message : 'Failed to clear clipboard',
        color: 'red',
      });
    }
  }, [clipboardSessionId, loadClipboard]);

  const dismissOperation = useCallback(async (operationId: string) => {
    try {
      await deleteOperation(operationId);
      await loadOperations();
    } catch (err) {
      notifications.show({
        title: 'Operation error',
        message: err instanceof Error ? err.message : 'Failed to clear operation',
        color: 'red',
      });
    }
  }, [loadOperations]);

  const submitRename = useCallback(async () => {
    if (!renameDialog.entry) {
      return;
    }

    const nextName = renameDialog.value.trim();

    if (!nextName || nextName === renameDialog.entry.name) {
      setRenameDialog({ opened: false, entry: null, value: '', isSubmitting: false });
      return;
    }

    setRenameDialog((previous) => ({ ...previous, isSubmitting: true }));

    try {
      await submitRenameEntry(renameDialog.entry, nextName);
      setRenameDialog({ opened: false, entry: null, value: '', isSubmitting: false });
    } catch (err) {
      setRenameDialog((previous) => ({ ...previous, isSubmitting: false }));
      notifications.show({
        title: 'Rename failed',
        message: err instanceof Error ? err.message : 'Failed to rename item',
        color: 'red',
      });
    }
  }, [renameDialog, submitRenameEntry]);

  const submitBookmark = useCallback(async () => {
    if (!bookmarkDialog.entry) {
      return;
    }

    const bookmarkName = bookmarkDialog.value.trim();

    if (!bookmarkName) {
      return;
    }

    setBookmarkDialog((previous) => ({ ...previous, isSubmitting: true }));

    try {
      await createBookmark({ name: bookmarkName, path: bookmarkDialog.entry.path, type: 'bookmark' });
      await Promise.all([loadBookmarks(), loadOperations()]);
      setBookmarkDialog({ opened: false, entry: null, value: '', isSubmitting: false });
      notifications.show({
        title: 'Bookmark added',
        message: `${bookmarkName} is now in bookmarks`,
        color: 'green',
      });
    } catch (err) {
      setBookmarkDialog((previous) => ({ ...previous, isSubmitting: false }));
      notifications.show({
        title: 'Bookmark failed',
        message: err instanceof Error ? err.message : 'Failed to create bookmark',
        color: 'red',
      });
    }
  }, [bookmarkDialog, loadBookmarks, loadOperations]);

  const submitDelete = useCallback(async () => {
    const targets = deleteDialog.paths;

    if (targets.length === 0) {
      setDeleteDialog({ opened: false, paths: [], isSubmitting: false });
      return;
    }

    setDeleteDialog((previous) => ({ ...previous, isSubmitting: true }));

    try {
      await deleteItems({ paths: targets });
      await Promise.all([loadBookmarks(), loadDirectory(currentPath), loadOperations()]);
      clearSelection();
      setDeleteDialog({ opened: false, paths: [], isSubmitting: false });
      notifications.show({
        title: 'Deleted',
        message: `${targets.length} item${targets.length === 1 ? '' : 's'} deleted`,
        color: 'green',
      });
    } catch (err) {
      setDeleteDialog((previous) => ({ ...previous, isSubmitting: false }));
      notifications.show({
        title: 'Delete failed',
        message: err instanceof Error ? err.message : 'Failed to delete items',
        color: 'red',
      });
    }
  }, [clearSelection, currentPath, deleteDialog.paths, loadBookmarks, loadDirectory, loadOperations]);

  return (
    <ExplorerContext.Provider
      value={{
        currentPath,
        files,
        folders,
        isLoading,
        error,
        selectedItems,
        history,
        historyIndex,
        viewMode,
        showHidden,
        sortBy,
        sortOrder,
        isSearching,
        searchQuery,
        homePath,
        bookmarks,
        clipboardStatus,
        operations,
        navigateTo,
        navigateBack,
        navigateForward,
        navigateUp,
        refresh,
        toggleSelection,
        clearSelection,
        setSelection,
        selectAll,
        setViewMode,
        toggleHidden,
        setSort,
        performSearch,
        clearSearch,
        openEntry,
        copySelection,
        cutSelection,
        pasteIntoCurrentPath,
        renameEntryByPath,
        submitRenameEntry,
        deleteSelection,
        showPropertiesForPath,
        addBookmarkForEntry,
        clearClipboardContents,
        dismissOperation,
      }}
    >
      {children}

      <Modal
        opened={renameDialog.opened}
        onClose={() => setRenameDialog({ opened: false, entry: null, value: '', isSubmitting: false })}
        title="Rename item"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Choose a new name for <Code>{renameDialog.entry?.name ?? ''}</Code>.
          </Text>
          <TextInput
            label="New name"
            value={renameDialog.value}
            onChange={(event) => setRenameDialog((previous) => ({ ...previous, value: event.currentTarget.value }))}
            disabled={renameDialog.isSubmitting}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submitRename();
              }
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRenameDialog({ opened: false, entry: null, value: '', isSubmitting: false })}>
              Cancel
            </Button>
            <Button onClick={() => void submitRename()} loading={renameDialog.isSubmitting}>
              Rename
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={bookmarkDialog.opened}
        onClose={() => setBookmarkDialog({ opened: false, entry: null, value: '', isSubmitting: false })}
        title="Add bookmark"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Save <Code>{bookmarkDialog.entry?.path ?? ''}</Code> for quick access.
          </Text>
          <TextInput
            label="Bookmark name"
            value={bookmarkDialog.value}
            onChange={(event) => setBookmarkDialog((previous) => ({ ...previous, value: event.currentTarget.value }))}
            disabled={bookmarkDialog.isSubmitting}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submitBookmark();
              }
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setBookmarkDialog({ opened: false, entry: null, value: '', isSubmitting: false })}>
              Cancel
            </Button>
            <Button onClick={() => void submitBookmark()} loading={bookmarkDialog.isSubmitting}>
              Save bookmark
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteDialog.opened}
        onClose={() => setDeleteDialog({ opened: false, paths: [], isSubmitting: false })}
        title="Delete items"
        centered
      >
        <Stack>
          <Text size="sm">
            Delete {deleteDialog.paths.length} item{deleteDialog.paths.length === 1 ? '' : 's'}? This action cannot be undone.
          </Text>
          <Stack gap={4}>
            {deleteDialog.paths.slice(0, 5).map((path) => (
              <Code key={path}>{entryNameByPath.get(path) ?? path}</Code>
            ))}
            {deleteDialog.paths.length > 5 ? (
              <Text size="xs" c="dimmed">+{deleteDialog.paths.length - 5} more</Text>
            ) : null}
          </Stack>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteDialog({ opened: false, paths: [], isSubmitting: false })}>
              Cancel
            </Button>
            <Button color="red" onClick={() => void submitDelete()} loading={deleteDialog.isSubmitting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={propertiesDialog.opened}
        onClose={() => setPropertiesDialog({ opened: false, path: null, entry: null, isLoading: false })}
        title={propertiesDialog.entry ? `${propertiesDialog.entry.name} details` : 'Item details'}
        centered
      >
        {propertiesDialog.isLoading ? (
          <Text size="sm" c="dimmed">Loading item details...</Text>
        ) : propertiesDialog.entry ? (
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <Text size="sm" c="dimmed">Path</Text>
              <Code>{propertiesDialog.entry.path}</Code>
            </Group>
            <Divider />
            <Group justify="space-between"><Text size="sm" c="dimmed">Type</Text><Text size="sm">{propertiesDialog.entry.type}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Size</Text><Text size="sm">{propertiesDialog.entry.size_human}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Modified</Text><Text size="sm">{propertiesDialog.entry.modified ?? '--'}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Owner</Text><Text size="sm">{propertiesDialog.entry.owner}:{propertiesDialog.entry.group}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Permissions</Text><Code>{propertiesDialog.entry.permissions}</Code></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Hidden</Text><Text size="sm">{propertiesDialog.entry.is_hidden ? 'Yes' : 'No'}</Text></Group>
            <Group justify="space-between"><Text size="sm" c="dimmed">Symlink</Text><Text size="sm">{propertiesDialog.entry.is_symlink ? 'Yes' : 'No'}</Text></Group>
            {propertiesDialog.entry.mime_type ? (
              <Group justify="space-between"><Text size="sm" c="dimmed">MIME type</Text><Text size="sm">{propertiesDialog.entry.mime_type}</Text></Group>
            ) : null}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">No details available.</Text>
        )}
      </Modal>
    </ExplorerContext.Provider>
  );
}
