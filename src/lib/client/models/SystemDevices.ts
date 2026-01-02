/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Disk } from './Disk';
import type { GenericDevice } from './GenericDevice';
export type SystemDevices = {
    summary: Record<string, any>;
    storage: Array<Disk>;
    video: Array<GenericDevice>;
    usb: Array<GenericDevice>;
    network: Array<GenericDevice>;
    multimedia: Array<GenericDevice>;
    other: Array<GenericDevice>;
};

