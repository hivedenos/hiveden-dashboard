'use server';

import { ExplorerService } from '@/lib/client';
import { 
  DirectoryListingResponse, 
  FileEntry, 
  CreateDirectoryRequest,
  RenameRequest,
  DeleteRequest,
  ClipboardCopyRequest,
  ClipboardPasteRequest,
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

export async function pasteItems(request: ClipboardPasteRequest) {
  const result = await ExplorerService.clipboardPasteExplorerClipboardPastePost(request);
  revalidatePath('/files');
  return result;
}

export async function searchFiles(request: SearchRequest): Promise<{ operation_id: string }> {
  return ExplorerService.searchFilesExplorerSearchPost(request);
}

export async function getOperationStatus(operationId: string): Promise<OperationResponse> {
    return ExplorerService.getOperationStatusExplorerOperationsOperationIdGet(operationId);
}