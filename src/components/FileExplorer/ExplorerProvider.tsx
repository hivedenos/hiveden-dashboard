import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Code, Divider, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import '@/lib/api';
import { getApiBaseUrl } from '@/lib/api';

import {
  clearClipboard,
  copyItems,
  createDirectory,
  createBookmark,
  deleteBookmark,
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
  updateBookmark,
} from '@/actions/explorer';
import {
  ClipboardStatusResponse,
  ExplorerOperation,
  ExplorerService,
  FileEntry,
  OperationResponse,
  SearchRequest,
  SortBy,
  SortOrder,
} from '@/lib/client';

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
  entry: FileEntry | BookmarkItem | null;
  value: string;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
};

type SearchOptions = Pick<SearchRequest, 'use_regex' | 'case_sensitive' | 'type_filter'>;

type DeleteDialogState = {
  opened: boolean;
  paths: string[];
  isSubmitting: boolean;
};

type CreateFolderDialogState = {
  opened: boolean;
  isSubmitting: boolean;
};

type PropertiesDialogState = {
  opened: boolean;
  path: string | null;
  entry: FileEntry | null;
  isLoading: boolean;
};

type UploadDialogState = {
  opened: boolean;
  files: File[];
  overwrite: boolean;
  conflicts: string[];
  conflictDetails: Array<{ path: string; reason?: string; existing_type?: string }>;
  isCheckingConflicts: boolean;
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
  isUploading: boolean;
  homePath: string;
  bookmarks: BookmarkItem[];
  clipboardStatus: ClipboardStatusResponse | null;
  operations: ExplorerOperation[];
  searchOptions: SearchOptions;
}

interface ExplorerContextType extends ExplorerState {
  navigateTo: (path: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateUp: () => void;
  refresh: () => void;
  refreshOperations: () => void;
  toggleSelection: (path: string, multi?: boolean) => void;
  clearSelection: () => void;
  setSelection: (paths: string[]) => void;
  selectAll: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleHidden: () => void;
  setSort: (by: SortBy, order: SortOrder) => void;
  performSearch: (query: string, optionsOverride?: SearchOptions) => void;
  clearSearch: () => void;
  setSearchOptions: (options: SearchOptions) => void;
  createFolder: () => void;
  uploadFiles: (files: File[]) => Promise<void>;
  openEntry: (entry: FileEntry) => void;
  copySelection: (paths?: string[]) => Promise<void>;
  cutSelection: (paths?: string[]) => Promise<void>;
  pasteIntoCurrentPath: () => Promise<void>;
  renameEntryByPath: (entry: FileEntry) => Promise<void>;
  submitRenameEntry: (entry: FileEntry, nextName: string) => Promise<void>;
  deleteSelection: (paths?: string[]) => Promise<void>;
  showPropertiesForPath: (path: string) => Promise<void>;
  addBookmarkForEntry: (entry: FileEntry) => Promise<void>;
  editBookmark: (bookmark: BookmarkItem) => void;
  removeBookmark: (bookmark: BookmarkItem) => Promise<void>;
  clearClipboardContents: () => Promise<void>;
  cancelOperation: (operationId: string) => Promise<void>;
  retryOperation: (operationId: string) => Promise<void>;
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

function parseOperationResult(result: ExplorerOperation['result']) {
  if (!result) {
    return null;
  }

  if (typeof result === 'string') {
    try {
      return JSON.parse(result) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return result as Record<string, unknown>;
}

function extractConflictPaths(input: unknown): string[] {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const record = input as Record<string, unknown>;
  const candidates = [record.conflicts, record.files, record.items, record.entries].find(Array.isArray);

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const value = item as Record<string, unknown>;
      return (value.path as string) || (value.name as string) || (value.relative_path as string) || null;
    })
    .filter((item): item is string => Boolean(item));
}

function extractConflictDetails(input: unknown): Array<{ path: string; reason?: string; existing_type?: string }> {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const record = input as Record<string, unknown>;
  const candidates = [record.conflicts, record.files, record.items, record.entries].find(Array.isArray);

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map((item) => {
      if (!item || typeof item !== 'object') {
        if (typeof item === 'string') {
          return { path: item };
        }
        return null;
      }

      const value = item as Record<string, unknown>;
      const path = (value.path as string) || (value.name as string) || (value.relative_path as string);
      if (!path) {
        return null;
      }

      return {
        path,
        reason: typeof value.reason === 'string' ? value.reason : undefined,
        existing_type: typeof value.existing_type === 'string' ? value.existing_type : undefined,
      };
    })
    .filter((item): item is { path: string; reason?: string; existing_type?: string } => Boolean(item));
}

function upsertOperation(operations: ExplorerOperation[], nextOperation: ExplorerOperation) {
  const existingIndex = operations.findIndex((operation) => operation.id === nextOperation.id);
  if (existingIndex === -1) {
    return [nextOperation, ...operations].slice(0, 8);
  }

  const updated = [...operations];
  updated[existingIndex] = nextOperation;
  return updated;
}

function extractFileEntriesFromOperation(operation: ExplorerOperation): FileEntry[] {
  const parsedResult = parseOperationResult(operation.result);
  if (!parsedResult) {
    return [];
  }

  const matches = parsedResult.matches ?? parsedResult.files ?? parsedResult.entries ?? parsedResult.result;
  return Array.isArray(matches) ? (matches as FileEntry[]) : [];
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
  const [isUploading, setIsUploading] = useState(false);
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
    mode: 'create',
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    opened: false,
    paths: [],
    isSubmitting: false,
  });
  const [createFolderDialog, setCreateFolderDialog] = useState<CreateFolderDialogState>({
    opened: false,
    isSubmitting: false,
  });
  const [createFolderName, setCreateFolderName] = useState('');
  const [propertiesDialog, setPropertiesDialog] = useState<PropertiesDialogState>({
    opened: false,
    path: null,
    entry: null,
    isLoading: false,
  });
  const [uploadDialog, setUploadDialog] = useState<UploadDialogState>({
    opened: false,
    files: [],
    overwrite: false,
    conflicts: [],
    conflictDetails: [],
    isCheckingConflicts: false,
  });

  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeOperationIdRef = useRef<string | null>(null);
  const uploadOperationCacheRef = useRef<Map<string, { files: File[]; destination: string; overwrite: boolean }>>(new Map());
  const operationPollersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    use_regex: false,
    case_sensitive: false,
    type_filter: 'all',
  });
  const updateSearchOptions = useCallback((options: SearchOptions) => {
    setSearchOptions(options);
  }, []);

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

  const stopOperationPolling = useCallback((operationId: string) => {
    const poller = operationPollersRef.current.get(operationId);
    if (poller) {
      clearInterval(poller);
      operationPollersRef.current.delete(operationId);
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

  const startOperationPolling = useCallback((operationId: string) => {
    if (operationPollersRef.current.has(operationId)) {
      return;
    }

    const poller = setInterval(async () => {
      try {
        const response = await getOperationStatus(operationId);
        setOperations((previous) => upsertOperation(previous, response.operation));

        if (!['pending', 'in_progress'].includes(response.operation.status)) {
          stopOperationPolling(operationId);
          await Promise.all([loadOperations(), loadDirectory(currentPath)]);
        }
      } catch {
        stopOperationPolling(operationId);
      }
    }, 1000);

    operationPollersRef.current.set(operationId, poller);
  }, [currentPath, loadDirectory, loadOperations, stopOperationPolling]);

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

    const activePollers = operationPollersRef.current;

    return () => {
      mounted = false;
      stopSearchPolling();
      activePollers.forEach((poller) => clearInterval(poller));
      activePollers.clear();
    };
  }, [loadBookmarks, loadClipboard, loadOperations, stopSearchPolling]);

  useEffect(() => {
    void loadOperations();
  }, [loadOperations]);

  const hasActiveOperations = useMemo(
    () => operations.some((operation) => operation.status === 'pending' || operation.status === 'in_progress'),
    [operations],
  );

  useEffect(() => {
    if (!hasActiveOperations) {
      return;
    }

    const intervalId = setInterval(() => {
      void loadOperations();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [hasActiveOperations, loadOperations]);

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

  const performSearch = useCallback(async (query: string, optionsOverride?: SearchOptions) => {
    const trimmedQuery = query.trim();
    const effectiveOptions = optionsOverride ?? searchOptions;

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
        use_regex: effectiveOptions.use_regex,
        case_sensitive: effectiveOptions.case_sensitive,
        type_filter: effectiveOptions.type_filter === 'all' ? undefined : effectiveOptions.type_filter,
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

            const entries = extractFileEntriesFromOperation(operation);

            if (Array.isArray(entries)) {
              setFiles(entries.filter((entry) => entry.type === 'file'));
              setFolders(entries.filter((entry) => entry.type === 'directory'));
            } else {
              setFiles([]);
              setFolders([]);
            }

            clearSelection();
          } else if (operation.status === 'cancelled') {
            stopSearchPolling();
            setIsLoading(false);
            const partialEntries = extractFileEntriesFromOperation(operation);
            if (partialEntries.length > 0) {
              setFiles(partialEntries.filter((entry) => entry.type === 'file'));
              setFolders(partialEntries.filter((entry) => entry.type === 'directory'));
            }
            notifications.show({
              title: 'Search cancelled',
              message: operation.error_message || 'The search was cancelled. Partial results may be shown.',
              color: 'yellow',
            });
          } else if (operation.status === 'failed') {
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
  }, [clearSearch, clearSelection, currentPath, files, folders, isSearching, searchOptions, showHidden, stopSearchPolling]);

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

  const refreshOperations = useCallback(() => {
    void loadOperations();
  }, [loadOperations]);

  const createFolder = useCallback(() => {
    setCreateFolderName('');
    setCreateFolderDialog({ opened: true, isSubmitting: false });
  }, []);

  const uploadFiles = useCallback(async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) {
      return;
    }

    setUploadDialog({
      opened: true,
      files: filesToUpload,
      overwrite: false,
      conflicts: [],
      conflictDetails: [],
      isCheckingConflicts: true,
    });

    try {
      const conflicts = await ExplorerService.checkUploadConflictsExplorerUploadConflictsPost({
        destination: currentPath,
        files: filesToUpload.map((file) => ({ name: file.name, size: file.size })),
        overwrite: false,
      });

      setUploadDialog((previous) => ({
        ...previous,
        conflicts: extractConflictPaths(conflicts),
        conflictDetails: extractConflictDetails(conflicts),
        isCheckingConflicts: false,
      }));
    } catch {
      setUploadDialog((previous) => ({
        ...previous,
        conflicts: [],
        conflictDetails: [],
        isCheckingConflicts: false,
      }));
    }
  }, [currentPath]);

  const submitUpload = useCallback(async () => {
    if (uploadDialog.files.length === 0) {
      setUploadDialog({ opened: false, files: [], overwrite: false, conflicts: [], conflictDetails: [], isCheckingConflicts: false });
      return;
    }

    setIsUploading(true);

    try {
      const prepareResponse = await ExplorerService.prepareUploadExplorerUploadPreparePost({
        destination: currentPath,
        files: uploadDialog.files.map((file) => ({ name: file.name, size: file.size })),
        overwrite: uploadDialog.overwrite,
      });
      uploadOperationCacheRef.current.set(prepareResponse.operation_id, {
        files: uploadDialog.files,
        destination: currentPath,
        overwrite: uploadDialog.overwrite,
      });
      setOperations((previous) => upsertOperation(previous, prepareResponse.operation));
      startOperationPolling(prepareResponse.operation_id);

      setUploadDialog({ opened: false, files: [], overwrite: false, conflicts: [], conflictDetails: [], isCheckingConflicts: false });
      setIsUploading(false);
      notifications.show({
        title: 'Upload started',
        message: 'Your files are uploading now. Track progress in the Operations panel.',
        color: 'blue',
      });

      void (async () => {
        try {
          const apiBaseUrl = getApiBaseUrl();

          for (const file of uploadDialog.files) {
            const url = new URL(`${apiBaseUrl}/explorer/upload/stream/${encodeURIComponent(prepareResponse.operation_id)}`);
            url.searchParams.set('filename', file.name);
            url.searchParams.set('size', String(file.size));
            url.searchParams.set('overwrite', String(uploadDialog.overwrite));

            const response = await fetch(url.toString(), {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type || 'application/octet-stream',
              },
            });

            let payload: unknown = null;

            try {
              payload = await response.json();
            } catch {
              payload = null;
            }

            if (!response.ok) {
              const errorMessage =
                payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message?: unknown }).message === 'string'
                  ? (payload as { message: string }).message
                  : `Failed to upload ${file.name}`;

              throw new Error(errorMessage);
            }

            if (payload && typeof payload === 'object' && 'operation' in payload) {
              const operation = (payload as { operation?: ExplorerOperation }).operation;
              if (operation) {
                setOperations((previous) => upsertOperation(previous, operation));
              }
            }
          }

          await Promise.all([loadDirectory(currentPath), loadOperations()]);

          const finalOperationResponse = await getOperationStatus(prepareResponse.operation_id);
          const finalOperation = finalOperationResponse.operation;
          setOperations((previous) => upsertOperation(previous, finalOperation));

          const finalResult = parseOperationResult(finalOperation.result);
          const summary = finalResult && typeof finalResult.summary === 'object' ? (finalResult.summary as Record<string, number>) : null;
          const hasIssues = Boolean(summary && ((summary.failed ?? 0) > 0 || (summary.skipped ?? 0) > 0 || (summary.cancelled ?? 0) > 0));

          notifications.show({
            title: hasIssues ? 'Upload finished with issues' : 'Upload complete',
            message: hasIssues
              ? 'Some files were skipped, cancelled, or failed. Review the Operations panel for details.'
              : `${uploadDialog.files.length} file${uploadDialog.files.length === 1 ? '' : 's'} uploaded successfully.`,
            color: hasIssues ? 'yellow' : 'green',
          });
        } catch (err) {
          notifications.show({
            title: 'Upload failed',
            message: err instanceof Error ? err.message : 'Failed to upload files',
            color: 'red',
          });
          await loadOperations();
        } finally {
          stopOperationPolling(prepareResponse.operation_id);
        }
      })();
    } catch (err) {
      notifications.show({
        title: 'Upload failed',
        message: err instanceof Error ? err.message : 'Failed to upload files',
        color: 'red',
      });
      setIsUploading(false);
    }
  }, [currentPath, loadDirectory, loadOperations, startOperationPolling, stopOperationPolling, uploadDialog.files, uploadDialog.overwrite]);

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
    setBookmarkDialog({ opened: true, entry, value: entry.name, isSubmitting: false, mode: 'create' });
  }, []);

  const editBookmark = useCallback((bookmark: BookmarkItem) => {
    setBookmarkDialog({ opened: true, entry: bookmark, value: bookmark.name, isSubmitting: false, mode: 'edit' });
  }, []);

  const removeBookmark = useCallback(async (bookmark: BookmarkItem) => {
    if (!bookmark.id) {
      notifications.show({ title: 'Bookmark Error', message: 'This bookmark cannot be removed yet.', color: 'red' });
      return;
    }

    try {
      await deleteBookmark(bookmark.id);
      await loadBookmarks();
      notifications.show({ title: 'Bookmark removed', message: `${bookmark.name} has been removed`, color: 'green' });
    } catch (err) {
      notifications.show({
        title: 'Bookmark Error',
        message: err instanceof Error ? err.message : 'Failed to remove bookmark',
        color: 'red',
      });
    }
  }, [loadBookmarks]);

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

  const cancelOperation = useCallback(async (operationId: string) => {
    try {
      const response: OperationResponse = await ExplorerService.cancelOperationExplorerOperationsOperationIdCancelPost(operationId);
      setOperations((previous) => previous.map((operation) => (operation.id === operationId ? response.operation : operation)));
      notifications.show({
        title: 'Operation cancelled',
        message: `Cancelled ${response.operation.operation_type.replace(/_/g, ' ')}`,
        color: 'yellow',
      });
    } catch (err) {
      notifications.show({
        title: 'Cancel failed',
        message: err instanceof Error ? err.message : 'Failed to cancel operation',
        color: 'red',
      });
    }
  }, []);

  const retryOperation = useCallback(async (operationId: string) => {
    const cachedUpload = uploadOperationCacheRef.current.get(operationId);

    if (!cachedUpload) {
      notifications.show({
        title: 'Retry unavailable',
        message: 'The original files are no longer available in this browser session.',
        color: 'yellow',
      });
      return;
    }

    setCurrentPath(cachedUpload.destination);
    setUploadDialog({
      opened: true,
      files: cachedUpload.files,
      overwrite: cachedUpload.overwrite,
      conflicts: [],
      conflictDetails: [],
      isCheckingConflicts: false,
    });

    notifications.show({
      title: 'Retry ready',
      message: 'Review the upload settings and confirm to retry.',
      color: 'blue',
    });
  }, []);

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
      if (bookmarkDialog.mode === 'edit' && 'id' in bookmarkDialog.entry && bookmarkDialog.entry.id) {
        await updateBookmark(bookmarkDialog.entry.id, { name: bookmarkName });
      } else {
        await createBookmark({ name: bookmarkName, path: bookmarkDialog.entry.path, type: 'bookmark' });
      }
      await Promise.all([loadBookmarks(), loadOperations()]);
      setBookmarkDialog({ opened: false, entry: null, value: '', isSubmitting: false, mode: 'create' });
      notifications.show({
        title: bookmarkDialog.mode === 'edit' ? 'Bookmark updated' : 'Bookmark added',
        message: bookmarkDialog.mode === 'edit' ? `${bookmarkName} has been updated` : `${bookmarkName} is now in bookmarks`,
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

  const submitCreateFolder = useCallback(async () => {
    const trimmedName = createFolderName.trim();

    if (!trimmedName) {
      return;
    }

    setCreateFolderDialog((previous) => ({ ...previous, isSubmitting: true }));

    try {
      await createDirectory({ path: buildChildPath(currentPath, trimmedName) });
      await Promise.all([loadDirectory(currentPath), loadOperations()]);
      setCreateFolderName('');
      setCreateFolderDialog({ opened: false, isSubmitting: false });
      notifications.show({
        title: 'Folder created',
        message: `${trimmedName} is ready`,
        color: 'green',
      });
    } catch (err) {
      setCreateFolderDialog((previous) => ({ ...previous, isSubmitting: false }));
      notifications.show({
        title: 'Create folder failed',
        message: err instanceof Error ? err.message : 'Failed to create folder',
        color: 'red',
      });
    }
  }, [createFolderName, currentPath, loadDirectory, loadOperations]);

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
        isUploading,
        homePath,
        bookmarks,
        clipboardStatus,
        operations,
        searchOptions,
        navigateTo,
        navigateBack,
        navigateForward,
        navigateUp,
        refresh,
        refreshOperations,
        toggleSelection,
        clearSelection,
        setSelection,
        selectAll,
        setViewMode,
        toggleHidden,
        setSort,
        performSearch,
        clearSearch,
        setSearchOptions: updateSearchOptions,
        createFolder,
        uploadFiles,
        openEntry,
        copySelection,
        cutSelection,
        pasteIntoCurrentPath,
        renameEntryByPath,
        submitRenameEntry,
        deleteSelection,
        showPropertiesForPath,
        addBookmarkForEntry,
        editBookmark,
        removeBookmark,
        clearClipboardContents,
        cancelOperation,
        retryOperation,
        dismissOperation,
      }}
    >
      {children}

      <Modal
        opened={uploadDialog.opened}
        onClose={() => !isUploading && setUploadDialog({ opened: false, files: [], overwrite: false, conflicts: [], conflictDetails: [], isCheckingConflicts: false })}
        title="Upload files"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Upload {uploadDialog.files.length} file{uploadDialog.files.length === 1 ? '' : 's'} into <Code>{currentPath}</Code>.
          </Text>
          {uploadDialog.isCheckingConflicts ? <Text size="sm">Checking for conflicts...</Text> : null}
          <Stack gap={4}>
            {uploadDialog.files.slice(0, 5).map((file) => (
              <Code key={`${file.name}-${file.size}`}>{file.name}</Code>
            ))}
            {uploadDialog.files.length > 5 ? <Text size="xs" c="dimmed">+{uploadDialog.files.length - 5} more</Text> : null}
          </Stack>
          {uploadDialog.conflicts.length > 0 ? (
            <Stack gap={4}>
              <Text size="sm" c="yellow">Conflicts detected</Text>
              {uploadDialog.conflictDetails.slice(0, 5).map((conflict) => (
                <Stack key={`${conflict.path}-${conflict.reason ?? 'conflict'}`} gap={2}>
                  <Code>{conflict.path}</Code>
                  {conflict.reason || conflict.existing_type ? (
                    <Text size="xs" c="dimmed">
                      {[conflict.reason, conflict.existing_type].filter(Boolean).join(' - ')}
                    </Text>
                  ) : null}
                </Stack>
              ))}
              {uploadDialog.conflicts.length > 5 ? <Text size="xs" c="dimmed">+{uploadDialog.conflicts.length - 5} more conflicts</Text> : null}
            </Stack>
          ) : null}
          <Checkbox
            label="Overwrite files with the same name"
            checked={uploadDialog.overwrite}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setUploadDialog((previous) => ({ ...previous, overwrite: checked }));
            }}
            disabled={isUploading || uploadDialog.isCheckingConflicts}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUploadDialog({ opened: false, files: [], overwrite: false, conflicts: [], conflictDetails: [], isCheckingConflicts: false })} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={() => void submitUpload()} loading={isUploading} disabled={uploadDialog.isCheckingConflicts}>
              Upload
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={createFolderDialog.opened}
        onClose={() => {
          setCreateFolderName('');
          setCreateFolderDialog({ opened: false, isSubmitting: false });
        }}
        title="Create folder"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Add a new folder inside <Code>{currentPath}</Code>.
          </Text>
          <TextInput
            label="Folder name"
            value={createFolderName}
            onChange={(event) => setCreateFolderName(event.currentTarget.value)}
            disabled={createFolderDialog.isSubmitting}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submitCreateFolder();
              }
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => {
              setCreateFolderName('');
              setCreateFolderDialog({ opened: false, isSubmitting: false });
            }}>
              Cancel
            </Button>
            <Button onClick={() => void submitCreateFolder()} loading={createFolderDialog.isSubmitting}>
              Create folder
            </Button>
          </Group>
        </Stack>
      </Modal>

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
        onClose={() => setBookmarkDialog({ opened: false, entry: null, value: '', isSubmitting: false, mode: 'create' })}
        title={bookmarkDialog.mode === 'edit' ? 'Edit bookmark' : 'Add bookmark'}
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
            <Button variant="default" onClick={() => setBookmarkDialog({ opened: false, entry: null, value: '', isSubmitting: false, mode: 'create' })}>
              Cancel
            </Button>
            <Button onClick={() => void submitBookmark()} loading={bookmarkDialog.isSubmitting}>
              {bookmarkDialog.mode === 'edit' ? 'Update bookmark' : 'Save bookmark'}
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
            <PropertyRow label="Path" value={<Code style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{propertiesDialog.entry.path}</Code>} />
            <Divider />
            <PropertyRow label="Type" value={<Text size="sm">{propertiesDialog.entry.type}</Text>} />
            <PropertyRow label="Size" value={<Text size="sm">{propertiesDialog.entry.size_human}</Text>} />
            <PropertyRow label="Modified" value={<Text size="sm">{propertiesDialog.entry.modified ?? '--'}</Text>} />
            <PropertyRow label="Owner" value={<Text size="sm" style={{ overflowWrap: 'anywhere' }}>{propertiesDialog.entry.owner}:{propertiesDialog.entry.group}</Text>} />
            <PropertyRow label="Permissions" value={<Code>{propertiesDialog.entry.permissions}</Code>} />
            <PropertyRow label="Hidden" value={<Text size="sm">{propertiesDialog.entry.is_hidden ? 'Yes' : 'No'}</Text>} />
            <PropertyRow label="Symlink" value={<Text size="sm">{propertiesDialog.entry.is_symlink ? 'Yes' : 'No'}</Text>} />
            {propertiesDialog.entry.mime_type ? (
              <PropertyRow label="MIME type" value={<Text size="sm" style={{ overflowWrap: 'anywhere' }}>{propertiesDialog.entry.mime_type}</Text>} />
            ) : null}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">No details available.</Text>
        )}
      </Modal>
    </ExplorerContext.Provider>
  );
}

function PropertyRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack gap={4}>
      <Text size="sm" c="dimmed">{label}</Text>
      {value}
    </Stack>
  );
}
