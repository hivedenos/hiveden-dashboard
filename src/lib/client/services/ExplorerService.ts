/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_upload_files_explorer_upload_post } from '../models/Body_upload_files_explorer_upload_post';
import type { ClipboardCopyRequest } from '../models/ClipboardCopyRequest';
import type { ClipboardPasteRequest } from '../models/ClipboardPasteRequest';
import type { ClipboardStatusResponse } from '../models/ClipboardStatusResponse';
import type { ConfigUpdateRequest } from '../models/ConfigUpdateRequest';
import type { CreateDirectoryRequest } from '../models/CreateDirectoryRequest';
import type { DeleteRequest } from '../models/DeleteRequest';
import type { DeleteResponse } from '../models/DeleteResponse';
import type { DirectoryListingResponse } from '../models/DirectoryListingResponse';
import type { FilePropertyResponse } from '../models/FilePropertyResponse';
import type { LocationCreateRequest } from '../models/LocationCreateRequest';
import type { LocationUpdateRequest } from '../models/LocationUpdateRequest';
import type { OperationResponse } from '../models/OperationResponse';
import type { RenameRequest } from '../models/RenameRequest';
import type { SearchRequest } from '../models/SearchRequest';
import { SortBy } from '../models/SortBy';
import { SortOrder } from '../models/SortOrder';
import type { UploadPrepareRequest } from '../models/UploadPrepareRequest';
import type { UploadPrepareResponse } from '../models/UploadPrepareResponse';
import type { UploadResponse } from '../models/UploadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExplorerService {
    /**
     * List Directory
     * @param path
     * @param showHidden
     * @param sortBy
     * @param sortOrder
     * @returns DirectoryListingResponse Successful Response
     * @throws ApiError
     */
    public static listDirectoryExplorerListGet(
        path: string,
        showHidden: boolean = false,
        sortBy: SortBy = SortBy.NAME,
        sortOrder: SortOrder = SortOrder.ASC,
    ): CancelablePromise<DirectoryListingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/list',
            query: {
                'path': path,
                'show_hidden': showHidden,
                'sort_by': sortBy,
                'sort_order': sortOrder,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Navigate
     * @param requestBody
     * @returns DirectoryListingResponse Successful Response
     * @throws ApiError
     */
    public static navigateExplorerNavigatePost(
        requestBody: Record<string, any>,
    ): CancelablePromise<DirectoryListingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/navigate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Properties
     * @param path
     * @returns FilePropertyResponse Successful Response
     * @throws ApiError
     */
    public static getPropertiesExplorerPropertiesGet(
        path: string,
    ): CancelablePromise<FilePropertyResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/properties',
            query: {
                'path': path,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Cwd
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getCwdExplorerCwdGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/cwd',
        });
    }
    /**
     * Create Directory
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createDirectoryExplorerCreateDirectoryPost(
        requestBody: CreateDirectoryRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/create-directory',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Prepare Upload
     * @param requestBody
     * @returns UploadPrepareResponse Successful Response
     * @throws ApiError
     */
    public static prepareUploadExplorerUploadPreparePost(
        requestBody: UploadPrepareRequest,
    ): CancelablePromise<UploadPrepareResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/upload/prepare',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Check Upload Conflicts
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static checkUploadConflictsExplorerUploadConflictsPost(
        requestBody: UploadPrepareRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/upload/conflicts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Files
     * @param formData
     * @returns UploadResponse Successful Response
     * @throws ApiError
     */
    public static uploadFilesExplorerUploadPost(
        formData: Body_upload_files_explorer_upload_post,
    ): CancelablePromise<UploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Items
     * @param requestBody
     * @returns DeleteResponse Successful Response
     * @throws ApiError
     */
    public static deleteItemsExplorerDeleteDelete(
        requestBody: DeleteRequest,
    ): CancelablePromise<DeleteResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/explorer/delete',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Rename Item
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static renameItemExplorerRenamePost(
        requestBody: RenameRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/rename',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download File
     * @param path
     * @returns any Successful Response
     * @throws ApiError
     */
    public static downloadFileExplorerDownloadGet(
        path: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/download',
            query: {
                'path': path,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clipboard Copy
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clipboardCopyExplorerClipboardCopyPost(
        requestBody: ClipboardCopyRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/clipboard/copy',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clipboard Cut
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clipboardCutExplorerClipboardCutPost(
        requestBody: ClipboardCopyRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/clipboard/cut',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clipboard Paste
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clipboardPasteExplorerClipboardPastePost(
        requestBody: ClipboardPasteRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/clipboard/paste',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clipboard Status
     * @param sessionId
     * @returns ClipboardStatusResponse Successful Response
     * @throws ApiError
     */
    public static clipboardStatusExplorerClipboardStatusGet(
        sessionId: string,
    ): CancelablePromise<ClipboardStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/clipboard/status',
            query: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clipboard Clear
     * @param sessionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static clipboardClearExplorerClipboardClearDelete(
        sessionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/explorer/clipboard/clear',
            query: {
                'session_id': sessionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Bookmarks
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listBookmarksExplorerBookmarksGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/bookmarks',
        });
    }
    /**
     * Create Bookmark
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createBookmarkExplorerBookmarksPost(
        requestBody: LocationCreateRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/bookmarks',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Bookmark
     * @param bookmarkId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateBookmarkExplorerBookmarksBookmarkIdPut(
        bookmarkId: number,
        requestBody: LocationUpdateRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/explorer/bookmarks/{bookmark_id}',
            path: {
                'bookmark_id': bookmarkId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Bookmark
     * @param bookmarkId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteBookmarkExplorerBookmarksBookmarkIdDelete(
        bookmarkId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/explorer/bookmarks/{bookmark_id}',
            path: {
                'bookmark_id': bookmarkId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Usb Devices
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listUsbDevicesExplorerUsbDevicesGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/usb-devices',
        });
    }
    /**
     * Search Files
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static searchFilesExplorerSearchPost(
        requestBody: SearchRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/search',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Operation Status
     * @param operationId
     * @returns OperationResponse Successful Response
     * @throws ApiError
     */
    public static getOperationStatusExplorerOperationsOperationIdGet(
        operationId: string,
    ): CancelablePromise<OperationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/operations/{operation_id}',
            path: {
                'operation_id': operationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Operation
     * @param operationId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteOperationExplorerOperationsOperationIdDelete(
        operationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/explorer/operations/{operation_id}',
            path: {
                'operation_id': operationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Operations
     * @param status
     * @param operationType
     * @param limit
     * @param offset
     * @returns any Successful Response
     * @throws ApiError
     */
    public static listOperationsExplorerOperationsGet(
        status?: (string | null),
        operationType?: (string | null),
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/operations',
            query: {
                'status': status,
                'operation_type': operationType,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Operation
     * @param operationId
     * @returns OperationResponse Successful Response
     * @throws ApiError
     */
    public static cancelOperationExplorerOperationsOperationIdCancelPost(
        operationId: string,
    ): CancelablePromise<OperationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/explorer/operations/{operation_id}/cancel',
            path: {
                'operation_id': operationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Explorer Config
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getExplorerConfigExplorerConfigGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/explorer/config',
        });
    }
    /**
     * Update Explorer Config
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static updateExplorerConfigExplorerConfigPut(
        requestBody: ConfigUpdateRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/explorer/config',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
