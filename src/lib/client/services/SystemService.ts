/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DNSConfigResponse } from '../models/DNSConfigResponse';
import type { DomainInfoResponse } from '../models/DomainInfoResponse';
import type { DomainUpdateRequest } from '../models/DomainUpdateRequest';
import type { DomainUpdateResponse } from '../models/DomainUpdateResponse';
import type { LocationListResponse } from '../models/LocationListResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { UpdateLocationRequest } from '../models/UpdateLocationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * Get System Domain
     * Get the current system domain and accessible containers.
     * @returns DomainInfoResponse Successful Response
     * @throws ApiError
     */
    public static getSystemDomainSystemDomainGet(): CancelablePromise<DomainInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system/domain',
        });
    }
    /**
     * Update System Domain
     * Update system domain and recreate accessible containers.
     * @param requestBody
     * @returns DomainUpdateResponse Successful Response
     * @throws ApiError
     */
    public static updateSystemDomainSystemDomainPut(
        requestBody: DomainUpdateRequest,
    ): CancelablePromise<DomainUpdateResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/system/domain',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Dns Config
     * Get DNS configuration and Pi-hole status.
     * @returns DNSConfigResponse Successful Response
     * @throws ApiError
     */
    public static getDnsConfigSystemDnsGet(): CancelablePromise<DNSConfigResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system/dns',
        });
    }
    /**
     * Get System Locations
     * Retrieve all system locations (system_root).
     * @returns LocationListResponse Successful Response
     * @throws ApiError
     */
    public static getSystemLocationsSystemLocationsGet(): CancelablePromise<LocationListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/system/locations',
        });
    }
    /**
     * Update System Location
     * Update a system location path (e.g., 'apps', 'movies').
     * Triggers data migration and container recreation.
     * @param key
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static updateSystemLocationSystemLocationsKeyPut(
        key: string,
        requestBody: UpdateLocationRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/system/locations/{key}',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
