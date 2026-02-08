'use server';

import '@/lib/api';
import { BackupsService } from "@/lib/client";
import { revalidatePath } from "next/cache";

export async function listBackups() {
  return BackupsService.listBackupsBackupsGet();
}

export async function listBackupSchedules() {
  return BackupsService.listSchedulesBackupsSchedulesGet();
}

export async function createBackupSchedule(data: any) {
  // Logic to check existing and replace if needed will be here or in component
  // The API might handle it, or we do it. Spec says "The old one should be deleted".
  // For now, simple wrapper.
  const result = await BackupsService.createScheduleBackupsSchedulesPost(data);
  revalidatePath('/backups');
  return result;
}

export async function deleteBackupSchedule(id: string) {
  await BackupsService.deleteScheduleBackupsSchedulesScheduleIdDelete(id);
  revalidatePath('/backups');
}

export async function createBackup(data: any) {
    await BackupsService.createBackupBackupsPost(data);
    revalidatePath('/backups');
}

export async function updateBackupSchedule(oldId: string, data: any) {
  // Since there is no update endpoint, we delete and recreate.
  await BackupsService.deleteScheduleBackupsSchedulesScheduleIdDelete(oldId);
  return BackupsService.createScheduleBackupsSchedulesPost(data);
}

export async function deleteBackup(filename: string) {
  await BackupsService.deleteBackupBackupsFilenameDelete(filename);
  revalidatePath('/backups');
}
