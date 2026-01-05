'use server';

import '@/lib/api';
import { SystemdService } from '@/lib/client';
import type { DataResponse } from '@/lib/client';
import { revalidatePath } from 'next/cache';

export async function getService(serviceName: string): Promise<DataResponse> {
  return SystemdService.getServiceSystemdServicesServiceNameGet(serviceName);
}

export async function manageService(serviceName: string, action: string): Promise<DataResponse> {
  const response = await SystemdService.manageServiceSystemdServicesServiceNameActionPost(serviceName, action);
  // Revalidate might be needed if the page shows status, but since we fetch client-side interval, it's fine.
  // revalidatePath('/shares'); 
  return response;
}
