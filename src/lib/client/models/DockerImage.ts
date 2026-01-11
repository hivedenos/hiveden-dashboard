/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageContainerInfo } from './ImageContainerInfo';
export type DockerImage = {
    id: string;
    tags: Array<string>;
    created: string;
    size: number;
    labels?: (Record<string, string> | null);
    containers?: (Array<ImageContainerInfo> | null);
};

