'use server';

import '@/lib/api';

import { ExplorerService } from '@/lib/client';
import { 
  ClipboardStatusResponse,
  DirectoryListingResponse, 
  ExplorerOperation,
  FilePropertyResponse,
  CreateDirectoryRequest,
  RenameRequest,
  DeleteRequest,
  ClipboardCopyRequest,
  ClipboardPasteRequest,
  LocationCreateRequest,
  LocationUpdateRequest,
  SearchRequest,
  SortBy,
  SortOrder,
  OperationResponse
} from '@/lib/client';
import { revalidatePath } from 'next/cache';

export async function listDirectory(path: string, sortBy: SortBy = SortBy.NAME, sortOrder: SortOrder = SortOrder.ASC, showHidden: boolean = false): Promise<DirectoryListingResponse> {
  return ExplorerService.listDirectoryExplorerListGet(path, showHidden, sortBy, sortOrder);
}

export async function createDirectory(request: CreateDirectoryRequest) {
  const result = await ExplorerService.createDirectoryExplorerCreateDirectoryPost(request);
  revalidatePath('/files'); 
  return result;
}

export async function deleteItems(request: DeleteRequest) {
  const result = await ExplorerService.deleteItemsExplorerDeleteDelete(request);
  revalidatePath('/files');
  return result;
}

export async function renameItem(request: RenameRequest) {
  const result = await ExplorerService.renameItemExplorerRenamePost(request);
  revalidatePath('/files');
  return result;
}

export async function copyItems(request: ClipboardCopyRequest) {
  return ExplorerService.clipboardCopyExplorerClipboardCopyPost(request);
}

export async function cutItems(request: ClipboardCopyRequest) {
  return ExplorerService.clipboardCutExplorerClipboardCutPost(request);
}

export async function pasteItems(request: ClipboardPasteRequest) {
  const result = await ExplorerService.clipboardPasteExplorerClipboardPastePost(request);
  revalidatePath('/files');
  return result;
}

export async function getClipboardStatus(sessionId: string): Promise<ClipboardStatusResponse> {
  return ExplorerService.clipboardStatusExplorerClipboardStatusGet(sessionId);
}

export async function clearClipboard(sessionId: string) {
  return ExplorerService.clipboardClearExplorerClipboardClearDelete(sessionId);
}

export async function getProperties(path: string): Promise<FilePropertyResponse> {
  return ExplorerService.getPropertiesExplorerPropertiesGet(path);
}

export async function getCurrentWorkingDirectory(): Promise<{ cwd?: string }> {
  return ExplorerService.getCwdExplorerCwdGet();
}

export async function listBookmarks() {
  return ExplorerService.listBookmarksExplorerBookmarksGet();
}

export async function createBookmark(request: LocationCreateRequest) {
  const result = await ExplorerService.createBookmarkExplorerBookmarksPost(request);
  revalidatePath('/files');
  return result;
}

export async function updateBookmark(bookmarkId: number, request: LocationUpdateRequest) {
  const result = await ExplorerService.updateBookmarkExplorerBookmarksBookmarkIdPut(bookmarkId, request);
  revalidatePath('/files');
  return result;
}

export async function deleteBookmark(bookmarkId: number) {
  const result = await ExplorerService.deleteBookmarkExplorerBookmarksBookmarkIdDelete(bookmarkId);
  revalidatePath('/files');
  return result;
}

export async function listOperations(limit: number = 10): Promise<ExplorerOperation[]> {
  const result = await ExplorerService.listOperationsExplorerOperationsGet(undefined, undefined, limit);

  if (Array.isArray(result)) {
    return result as ExplorerOperation[];
  }

  if (result && typeof result === 'object') {
    const candidate = (result as { operations?: unknown; items?: unknown; data?: unknown }).operations
      ?? (result as { items?: unknown }).items
      ?? (result as { data?: unknown }).data;

    if (Array.isArray(candidate)) {
      return candidate as ExplorerOperation[];
    }
  }

  return [];
}

export async function deleteOperation(operationId: string) {
  return ExplorerService.deleteOperationExplorerOperationsOperationIdDelete(operationId);
}

export async function searchFiles(request: SearchRequest): Promise<{ operation_id: string }> {
  return ExplorerService.searchFilesExplorerSearchPost(request);
}

export async function getOperationStatus(operationId: string): Promise<OperationResponse> {
    return ExplorerService.getOperationStatusExplorerOperationsOperationIdGet(operationId);
}
