/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExplorerOperation } from './ExplorerOperation';
import type { FileEntry } from './FileEntry';
export type UploadResponse = {
    success?: boolean;
    message?: (string | null);
    error?: (Record<string, any> | null);
    operation_id: string;
    operation: ExplorerOperation;
    destination: string;
    uploaded?: Array<FileEntry>;
};

