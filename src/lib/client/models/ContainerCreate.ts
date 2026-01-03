/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Device } from './Device';
import type { EnvVar } from './EnvVar';
import type { IngressConfig } from './IngressConfig';
import type { Mount } from './Mount';
import type { Port } from './Port';
export type ContainerCreate = {
    name: string;
    image: string;
    command?: (Array<string> | null);
    env?: (Array<EnvVar> | null);
    ports?: (Array<Port> | null);
    mounts?: (Array<Mount> | null);
    devices?: (Array<Device> | null);
    labels?: (Record<string, string> | null);
    ingress_config?: (IngressConfig | null);
    privileged?: (boolean | null);
    is_container?: boolean;
    enabled?: boolean;
    type?: string;
};

