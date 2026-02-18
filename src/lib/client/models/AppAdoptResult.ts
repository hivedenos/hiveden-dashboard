/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppAdoptedContainer } from './AppAdoptedContainer';
import type { AppSummary } from './AppSummary';
export type AppAdoptResult = {
    app: AppSummary;
    containers?: Array<AppAdoptedContainer>;
    warnings?: Array<string>;
};

