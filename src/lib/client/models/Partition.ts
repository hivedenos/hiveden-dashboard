/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MountPoint } from './MountPoint';
export type Partition = {
    name: string;
    path: string;
    size: number;
    fstype?: (string | null);
    uuid?: (string | null);
    mountpoint?: (string | null);
    mountpoints?: Array<MountPoint>;
};

