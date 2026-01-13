/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LogEntry = {
    id: number;
    created_at: string;
    message: string;
    level: string;
    actor: string;
    action?: (string | null);
    module?: (string | null);
    metadata?: (Record<string, any> | null);
};

