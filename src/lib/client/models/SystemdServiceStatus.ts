/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SystemdServiceStatus = {
    name: string;
    description?: (string | null);
    load_state: string;
    active_state: string;
    sub_state: string;
    unit_file_state: string;
    main_pid?: (number | null);
    since?: (string | null);
};

