/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BtrfsShareListResponse } from '../models/BtrfsShareListResponse';
import type { BtrfsVolumeListResponse } from '../models/BtrfsVolumeListResponse';
import type { CreateBtrfsShareRequest } from '../models/CreateBtrfsShareRequest';
import type { DataResponse } from '../models/DataResponse';
import type { MountSMBShareRequest } from '../models/MountSMBShareRequest';
import type { SMBListResponse } from '../models/SMBListResponse';
import type { SMBShareCreate } from '../models/SMBShareCreate';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { ZFSDatasetCreate } from '../models/ZFSDatasetCreate';
import type { ZFSPoolCreate } from '../models/ZFSPoolCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SharesService {
    /**
     * Mount Smb Share Endpoint
     * Mount a remote SMB share.
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static mountSmbShareEndpointSharesSmbMountPost(
        requestBody: MountSMBShareRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/shares/smb/mount',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Unmount Smb Share Endpoint
     * Unmount a remote SMB share.
     * @param mountPoint
     * @param removePersistence
     * @param force
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static unmountSmbShareEndpointSharesSmbMountDelete(
        mountPoint: string,
        removePersistence: boolean = false,
        force: boolean = false,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/shares/smb/mount',
            query: {
                'mount_point': mountPoint,
                'remove_persistence': removePersistence,
                'force': force,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Zfs Pools Endpoint
     * @returns DataResponse Successful Response
     * @throws ApiError
     */
    public static listZfsPoolsEndpointSharesZfsPoolsGet(): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shares/zfs/pools',
        });
    }
    /**
     * Create Zfs Pool Endpoint
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static createZfsPoolEndpointSharesZfsPoolsPost(
        requestBody: ZFSPoolCreate,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/shares/zfs/pools',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Destroy Zfs Pool Endpoint
     * @param name
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static destroyZfsPoolEndpointSharesZfsPoolsNameDelete(
        name: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/shares/zfs/pools/{name}',
            path: {
                'name': name,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Zfs Datasets Endpoint
     * @param pool
     * @returns DataResponse Successful Response
     * @throws ApiError
     */
    public static listZfsDatasetsEndpointSharesZfsDatasetsPoolGet(
        pool: string,
    ): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shares/zfs/datasets/{pool}',
            path: {
                'pool': pool,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Zfs Dataset Endpoint
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static createZfsDatasetEndpointSharesZfsDatasetsPost(
        requestBody: ZFSDatasetCreate,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/shares/zfs/datasets',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Destroy Zfs Dataset Endpoint
     * @param name
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static destroyZfsDatasetEndpointSharesZfsDatasetsNameDelete(
        name: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/shares/zfs/datasets/{name}',
            path: {
                'name': name,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Available Devices Endpoint
     * @returns DataResponse Successful Response
     * @throws ApiError
     */
    public static listAvailableDevicesEndpointSharesZfsAvailableDevicesGet(): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shares/zfs/available-devices',
        });
    }
    /**
     * List Smb Shares Endpoint
     * @returns SMBListResponse Successful Response
     * @throws ApiError
     */
    public static listSmbSharesEndpointSharesSmbGet(): CancelablePromise<SMBListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shares/smb',
        });
    }
    /**
     * Create Smb Share Endpoint
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static createSmbShareEndpointSharesSmbPost(
        requestBody: SMBShareCreate,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/shares/smb',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Destroy Smb Share Endpoint
     * @param name
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static destroySmbShareEndpointSharesSmbNameDelete(
        name: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/shares/smb/{name}',
            path: {
                'name': name,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Btrfs Volumes Endpoint
     * @returns BtrfsVolumeListResponse Successful Response
     * @throws ApiError
     */
    public static listBtrfsVolumesEndpointSharesBtrfsVolumesGet(): CancelablePromise<BtrfsVolumeListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shares/btrfs/volumes',
        });
    }
    /**
     * List Btrfs Shares Endpoint
     * @returns BtrfsShareListResponse Successful Response
     * @throws ApiError
     */
    public static listBtrfsSharesEndpointSharesBtrfsSharesGet(): CancelablePromise<BtrfsShareListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shares/btrfs/shares',
        });
    }
    /**
     * Create Btrfs Share Endpoint
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static createBtrfsShareEndpointSharesBtrfsSharesPost(
        requestBody: CreateBtrfsShareRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/shares/btrfs/shares',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
