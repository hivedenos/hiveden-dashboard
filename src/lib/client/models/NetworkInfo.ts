/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NetworkInterface } from './NetworkInterface';
import type { NetworkIOCounters } from './NetworkIOCounters';
export type NetworkInfo = {
    interfaces: Record<string, NetworkInterface>;
    io_counters: NetworkIOCounters;
    primary_ip: string;
};

