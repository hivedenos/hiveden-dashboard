/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContainerDependencyItem } from './ContainerDependencyItem';
export type ContainerDependencyCheckResult = {
    all_satisfied: boolean;
    missing: Array<string>;
    items: Array<ContainerDependencyItem>;
};

