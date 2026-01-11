/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DiskDetailResponse } from '../models/DiskDetailResponse';
import type { DiskListResponse } from '../models/DiskListResponse';
import type { MountRequest } from '../models/MountRequest';
import type { RaidAddDiskRequest } from '../models/RaidAddDiskRequest';
import type { StorageStrategy } from '../models/StorageStrategy';
import type { StorageStrategyApplyResponse } from '../models/StorageStrategyApplyResponse';
import type { StorageStrategyListResponse } from '../models/StorageStrategyListResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StorageService {
    /**
     * Add Disk To Raid
     * Add a disk to an existing RAID array, optionally changing the RAID level.
     * @param mdDeviceName
     * @param requestBody
     * @returns StorageStrategyApplyResponse Successful Response
     * @throws ApiError
     */
    public static addDiskToRaidStorageRaidMdDeviceNameAddDiskPost(
        mdDeviceName: string,
        requestBody: RaidAddDiskRequest,
    ): CancelablePromise<StorageStrategyApplyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/storage/raid/{md_device_name}/add-disk',
            path: {
                'md_device_name': mdDeviceName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                422: `Validation Error`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Mount Partition
     * Mounts a disk partition.
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static mountPartitionStorageMountPost(
        requestBody: MountRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/storage/mount',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                422: `Validation Error`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List Devices
     * List all block devices on the system.
     * @returns DiskListResponse Successful Response
     * @throws ApiError
     */
    public static listDevicesStorageDevicesGet(): CancelablePromise<DiskListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/storage/devices',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get Device Details
     * Get detailed information for a specific disk (including SMART data).
     * @param deviceName
     * @returns DiskDetailResponse Successful Response
     * @throws ApiError
     */
    public static getDeviceDetailsStorageDevicesDeviceNameGet(
        deviceName: string,
    ): CancelablePromise<DiskDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/storage/devices/{device_name}',
            path: {
                'device_name': deviceName,
            },
            errors: {
                404: `Device not found`,
                422: `Validation Error`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List Strategies
     * Suggests storage configuration strategies based on currently unused disks.
     * @returns StorageStrategyListResponse Successful Response
     * @throws ApiError
     */
    public static listStrategiesStorageStrategiesGet(): CancelablePromise<StorageStrategyListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/storage/strategies',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Apply Strategy
     * Applies a storage strategy. Starts a background job.
     * @param requestBody
     * @returns StorageStrategyApplyResponse Successful Response
     * @throws ApiError
     */
    public static applyStrategyStorageApplyPost(
        requestBody: StorageStrategy,
    ): CancelablePromise<StorageStrategyApplyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/storage/apply',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
                500: `Internal Server Error`,
            },
        });
    }
}
