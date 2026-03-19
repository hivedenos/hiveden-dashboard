/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UploadFileDescriptor } from './UploadFileDescriptor';
export type UploadPrepareRequest = {
    destination: string;
    files: Array<UploadFileDescriptor>;
    overwrite?: boolean;
};

