/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IngressContainerInfo } from './IngressContainerInfo';
export type DomainInfoResponse = {
    status?: string;
    message?: (string | null);
    domain: string;
    containers: Array<IngressContainerInfo>;
};

