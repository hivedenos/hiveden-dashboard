/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataResponse } from '../models/DataResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InfoService {
    /**
     * Get Os Info Endpoint
     * @returns DataResponse Successful Response
     * @throws ApiError
     */
    public static getOsInfoEndpointInfoOsGet(): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/info/os',
        });
    }
    /**
     * Get Hw Info Endpoint
     * @returns DataResponse Successful Response
     * @throws ApiError
     */
    public static getHwInfoEndpointInfoHwGet(): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/info/hw',
        });
    }
    /**
     * Get All Devices Endpoint
     * @returns DataResponse Successful Response
     * @throws ApiError
     */
    public static getAllDevicesEndpointInfoDevicesGet(): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/info/devices',
        });
    }
    /**
     * Get Version Endpoint
     * @returns DataResponse Successful Response
     * @throws ApiError
     */
    public static getVersionEndpointInfoVersionGet(): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/info/version',
        });
    }
}
