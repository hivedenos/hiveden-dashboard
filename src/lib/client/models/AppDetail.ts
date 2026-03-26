/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppInstalledContainer } from './AppInstalledContainer';
export type AppDetail = {
    catalog_id: string;
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
    channel?: string;
    channel_label?: (string | null);
    risk_level?: (string | null);
    support_tier?: (string | null);
    origin_channel?: (string | null);
    promotion_status?: (string | null);
    installed?: boolean;
    install_status?: (string | null);
    installable?: boolean;
    install_block_reason?: (string | null);
    promotion_request_status?: (string | null);
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
    installed_containers?: Array<AppInstalledContainer>;
};

