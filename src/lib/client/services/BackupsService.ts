/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Backup } from '../models/Backup';
import type { BackupConfig } from '../models/BackupConfig';
import type { BackupCreateRequest } from '../models/BackupCreateRequest';
import type { BackupRestoreRequest } from '../models/BackupRestoreRequest';
import type { BackupSchedule } from '../models/BackupSchedule';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BackupsService {
    /**
     * Get Backup Config
     * @returns BackupConfig Successful Response
     * @throws ApiError
     */
    public static getBackupConfigBackupsConfigGet(): CancelablePromise<BackupConfig> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/backups/config',
        });
    }
    /**
     * Update Backup Config
     * @param requestBody
     * @returns BackupConfig Successful Response
     * @throws ApiError
     */
    public static updateBackupConfigBackupsConfigPut(
        requestBody: BackupConfig,
    ): CancelablePromise<BackupConfig> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/backups/config',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Schedules
     * @returns BackupSchedule Successful Response
     * @throws ApiError
     */
    public static listSchedulesBackupsSchedulesGet(): CancelablePromise<Array<BackupSchedule>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/backups/schedules',
        });
    }
    /**
     * Create Schedule
     * @param requestBody
     * @returns BackupSchedule Successful Response
     * @throws ApiError
     */
    public static createScheduleBackupsSchedulesPost(
        requestBody: BackupSchedule,
    ): CancelablePromise<BackupSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/backups/schedules',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Schedule
     * @param scheduleId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteScheduleBackupsSchedulesScheduleIdDelete(
        scheduleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/backups/schedules/{schedule_id}',
            path: {
                'schedule_id': scheduleId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Backups
     * @param type
     * @param target
     * @returns Backup Successful Response
     * @throws ApiError
     */
    public static listBackupsBackupsGet(
        type?: (string | null),
        target?: (string | null),
    ): CancelablePromise<Array<Backup>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/backups',
            query: {
                'type': type,
                'target': target,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Backup
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static createBackupBackupsPost(
        requestBody: BackupCreateRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/backups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Restore Backup
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static restoreBackupBackupsRestorePost(
        requestBody: BackupRestoreRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/backups/restore',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
