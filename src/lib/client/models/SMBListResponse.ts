/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SMBMount } from './SMBMount';
import type { SMBShare } from './SMBShare';
export type SMBListResponse = {
    status?: string;
    message?: (string | null);
    exported: Array<SMBShare>;
    mounted: Array<SMBMount>;
};

