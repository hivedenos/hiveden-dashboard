/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AppDetail = {
    app_id: string;
    title: string;
    version?: (string | null);
    tagline?: (string | null);
    description?: (string | null);
    category?: (string | null);
    icon?: (string | null);
    icon_url?: (string | null);
    compose_url?: (string | null);
    image_urls?: Array<string>;
    dependencies?: Array<string>;
    repository_path?: (string | null);
    developer?: (string | null);
    installed?: boolean;
    install_status?: (string | null);
    website?: (string | null);
    repo?: (string | null);
    support?: (string | null);
    dependencies_apps?: Array<string>;
    dependencies_system_packages?: Array<string>;
    manifest_url?: (string | null);
    source?: Record<string, any>;
    install?: Record<string, any>;
    search?: Record<string, any>;
    source_updated_at?: (string | null);
};

