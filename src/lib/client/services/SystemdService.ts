/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemdServiceListResponse } from '../models/SystemdServiceListResponse';
import type { SystemdServiceResponse } from '../models/SystemdServiceResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemdService {
    /**
     * List Services
     * List all managed systemd services.
     * @returns SystemdServiceListResponse Successful Response
     * @throws ApiError
     */
    public static listServicesSystemdServicesGet(): CancelablePromise<SystemdServiceListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/systemd/services',
        });
    }
    /**
     * Get Service
     * Get status of a specific service.
     * @param serviceName
     * @returns SystemdServiceResponse Successful Response
     * @throws ApiError
     */
    public static getServiceSystemdServicesServiceNameGet(
        serviceName: string,
    ): CancelablePromise<SystemdServiceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/systemd/services/{service_name}',
            path: {
                'service_name': serviceName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Manage Service
     * Perform action on service (start, stop, restart, enable, disable).
     * Note: action parameter in path is for convenience/REST style,
     * but we can also use body. Using path here as per request.
     * @param serviceName
     * @param action
     * @returns SystemdServiceResponse Successful Response
     * @throws ApiError
     */
    public static manageServiceSystemdServicesServiceNameActionPost(
        serviceName: string,
        action: string,
    ): CancelablePromise<SystemdServiceResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/systemd/services/{service_name}/{action}',
            path: {
                'service_name': serviceName,
                'action': action,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
