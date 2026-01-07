'use server';

import '@/lib/api';
import { DatabaseService } from '@/lib/client';
import type { 
  DatabaseListResponse, 
  DatabaseUserListResponse, 
  DatabaseCreateRequest, 
  SuccessResponse 
} from '@/lib/client';
import { revalidatePath } from 'next/cache';

export async function listDatabases(): Promise<DatabaseListResponse> {
  return DatabaseService.listDatabasesDbDatabasesGet();
}

export async function listUsers(): Promise<DatabaseUserListResponse> {
  return DatabaseService.listUsersDbUsersGet();
}

export async function createDatabase(db: DatabaseCreateRequest): Promise<SuccessResponse> {
  const response = await DatabaseService.createDatabaseDbDatabasesPost(db);
  revalidatePath('/docker'); 
  return response;
}
