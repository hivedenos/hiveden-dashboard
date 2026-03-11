/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppAdoptRequest } from '../models/AppAdoptRequest';
import type { AppAdoptResponse } from '../models/AppAdoptResponse';
import type { AppCacheClearRequest } from '../models/AppCacheClearRequest';
import type { AppCacheClearResponse } from '../models/AppCacheClearResponse';
import type { AppDetailResponse } from '../models/AppDetailResponse';
import type { AppInstallRequest } from '../models/AppInstallRequest';
import type { AppInstallResponse } from '../models/AppInstallResponse';
import type { AppListResponse } from '../models/AppListResponse';
import type { AppPromotionRequestCreate } from '../models/AppPromotionRequestCreate';
import type { AppPromotionRequestResponse } from '../models/AppPromotionRequestResponse';
import type { AppSyncResponse } from '../models/AppSyncResponse';
import type { AppUninstallRequest } from '../models/AppUninstallRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AppStoreService {
    /**
     * Sync Catalog
     * @returns AppSyncResponse Successful Response
     * @throws ApiError
     */
    public static syncCatalogAppStoreSyncPost(): CancelablePromise<AppSyncResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/app-store/sync',
        });
    }
    /**
     * List Apps
     * @param q Search query
     * @param category Category filter
     * @param channel Channel filter
     * @param installed Filter by install state
     * @param limit
     * @param offset
     * @returns AppListResponse Successful Response
     * @throws ApiError
     */
    public static listAppsAppStoreAppsGet(
        q?: (string | null),
        category?: (string | null),
        channel?: (string | null),
        installed?: (boolean | null),
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<AppListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/app-store/apps',
            query: {
                'q': q,
                'category': category,
                'channel': channel,
                'installed': installed,
                'limit': limit,
                'offset': offset,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Installed Apps
     * @returns AppListResponse Successful Response
     * @throws ApiError
     */
    public static listInstalledAppsAppStoreInstalledGet(): CancelablePromise<AppListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/app-store/installed',
        });
    }
    /**
     * Get App Detail
     * @param appId
     * @returns AppDetailResponse Successful Response
     * @throws ApiError
     */
    public static getAppDetailAppStoreAppsAppIdGet(
        appId: string,
    ): CancelablePromise<AppDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/app-store/apps/{app_id}',
            path: {
                'app_id': appId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Install App
     * @param appId
     * @param requestBody
     * @returns AppInstallResponse Successful Response
     * @throws ApiError
     */
    public static installAppAppStoreAppsAppIdInstallPost(
        appId: string,
        requestBody: AppInstallRequest,
    ): CancelablePromise<AppInstallResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/app-store/apps/{app_id}/install',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Uninstall App
     * @param appId
     * @param requestBody
     * @returns AppInstallResponse Successful Response
     * @throws ApiError
     */
    public static uninstallAppAppStoreAppsAppIdUninstallPost(
        appId: string,
        requestBody: AppUninstallRequest,
    ): CancelablePromise<AppInstallResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/app-store/apps/{app_id}/uninstall',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Adopt Existing App Containers
     * @param appId
     * @param requestBody
     * @returns AppAdoptResponse Successful Response
     * @throws ApiError
     */
    public static adoptExistingAppContainersAppStoreAppsAppIdAdoptPost(
        appId: string,
        requestBody: AppAdoptRequest,
    ): CancelablePromise<AppAdoptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/app-store/apps/{app_id}/adopt',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Request App Promotion
     * @param appId
     * @param requestBody
     * @returns AppPromotionRequestResponse Successful Response
     * @throws ApiError
     */
    public static requestAppPromotionAppStoreAppsAppIdPromotionRequestPost(
        appId: string,
        requestBody: AppPromotionRequestCreate,
    ): CancelablePromise<AppPromotionRequestResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/app-store/apps/{app_id}/promotion-request',
            path: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Clear Catalog Cache
     * @param requestBody
     * @returns AppCacheClearResponse Successful Response
     * @throws ApiError
     */
    public static clearCatalogCacheAppStoreCacheClearPost(
        requestBody: AppCacheClearRequest,
    ): CancelablePromise<AppCacheClearResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/app-store/cache/clear',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
