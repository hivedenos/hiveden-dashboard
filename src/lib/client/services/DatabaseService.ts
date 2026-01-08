/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DatabaseCreateRequest } from '../models/DatabaseCreateRequest';
import type { DatabaseListResponse } from '../models/DatabaseListResponse';
import type { DatabaseUserListResponse } from '../models/DatabaseUserListResponse';
import type { SuccessResponse } from '../models/SuccessResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatabaseService {
    /**
     * List Databases
     * List all databases.
     * @returns DatabaseListResponse Successful Response
     * @throws ApiError
     */
    public static listDatabasesDbDatabasesGet(): CancelablePromise<DatabaseListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/db/databases',
        });
    }
    /**
     * Create Database
     * Create a new database.
     * @param requestBody
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static createDatabaseDbDatabasesPost(
        requestBody: DatabaseCreateRequest,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/db/databases',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Database
     * Delete a database.
     * @param dbName
     * @returns SuccessResponse Successful Response
     * @throws ApiError
     */
    public static deleteDatabaseDbDatabasesDbNameDelete(
        dbName: string,
    ): CancelablePromise<SuccessResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/db/databases/{db_name}',
            path: {
                'db_name': dbName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Users
     * List all database users.
     * @returns DatabaseUserListResponse Successful Response
     * @throws ApiError
     */
    public static listUsersDbUsersGet(): CancelablePromise<DatabaseUserListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/db/users',
        });
    }
}
