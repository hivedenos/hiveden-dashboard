/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ExplorerOperation = {
    id: string;
    operation_type: string;
    status: string;
    progress?: number;
    total_items?: (number | null);
    processed_items?: number;
    source_paths?: (Array<string> | string | null);
    destination_path?: (string | null);
    error_message?: (string | null);
    result?: (string | Record<string, any> | null);
    created_at?: (string | null);
    updated_at?: (string | null);
    completed_at?: (string | null);
};

