/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse } from '../models/BaseResponse';
import type { VolumeListResponse } from '../models/VolumeListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DockerVolumesService {
    /**
     * List Docker Volumes
     * List Docker volumes.
     * @param dangling Filter by dangling volumes when provided.
     * @returns VolumeListResponse Successful Response
     * @throws ApiError
     */
    public static listDockerVolumesDockerVolumesGet(
        dangling?: (boolean | null),
    ): CancelablePromise<VolumeListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/docker/volumes',
            query: {
                'dangling': dangling,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Docker Volume
     * Delete Docker volume by name.
     * @param volumeName
     * @returns BaseResponse Successful Response
     * @throws ApiError
     */
    public static deleteDockerVolumeDockerVolumesVolumeNameDelete(
        volumeName: string,
    ): CancelablePromise<BaseResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/docker/volumes/{volume_name}',
            path: {
                'volume_name': volumeName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
