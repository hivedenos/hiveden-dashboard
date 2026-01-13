/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LogListResponse } from '../models/LogListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LogsService {
    /**
     * Get Logs
     * Retrieve system logs with optional filtering.
     * @param limit
     * @param offset
     * @param level
     * @param module
     * @returns LogListResponse Successful Response
     * @throws ApiError
     */
    public static getLogsLogsGet(
        limit: number = 100,
        offset?: number,
        level?: (string | null),
        module?: (string | null),
    ): CancelablePromise<LogListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/logs',
            query: {
                'limit': limit,
                'offset': offset,
                'level': level,
                'module': module,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
