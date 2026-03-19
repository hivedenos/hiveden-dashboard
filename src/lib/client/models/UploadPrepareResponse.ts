/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExplorerOperation } from './ExplorerOperation';
export type UploadPrepareResponse = {
    success?: boolean;
    message?: (string | null);
    error?: (Record<string, any> | null);
    operation_id: string;
    operation: ExplorerOperation;
    destination: string;
    files?: Array<Record<string, any>>;
};

