/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse } from '../models/BaseResponse';
import type { ImageLayerListResponse } from '../models/ImageLayerListResponse';
import type { ImageListResponse } from '../models/ImageListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DockerImagesService {
    /**
     * Delete Image
     * Delete a Docker image.
     * Does not support forced removal.
     * @param imageId
     * @returns BaseResponse Successful Response
     * @throws ApiError
     */
    public static deleteImageDockerImagesImageIdDelete(
        imageId: string,
    ): CancelablePromise<BaseResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/docker/images/{image_id}',
            path: {
                'image_id': imageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Images
     * List all Docker images.
     * @returns ImageListResponse Successful Response
     * @throws ApiError
     */
    public static listImagesDockerImagesGet(): CancelablePromise<ImageListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/docker/images',
        });
    }
    /**
     * Get Image Layers
     * Get layers (history) of a Docker image.
     * Note: image_id might contain slashes if it's a repo/name:tag, so use :path.
     * @param imageId
     * @returns ImageLayerListResponse Successful Response
     * @throws ApiError
     */
    public static getImageLayersDockerImagesImageIdLayersGet(
        imageId: string,
    ): CancelablePromise<ImageLayerListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/docker/images/{image_id}/layers',
            path: {
                'image_id': imageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
