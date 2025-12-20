/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EnvVar } from './EnvVar';
import type { IngressConfig } from './IngressConfig';
import type { Mount } from './Mount';
import type { Port } from './Port';
export type TemplateCreate = {
    name: string;
    image: string;
    command?: (Array<string> | null);
    env?: (Array<EnvVar> | null);
    ports?: (Array<Port> | null);
    mounts?: (Array<Mount> | null);
    labels?: (Record<string, string> | null);
    ingress_config?: (IngressConfig | null);
    is_container?: boolean;
    enabled?: boolean;
    type?: string;
};

