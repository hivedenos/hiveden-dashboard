'use server';

import '@/lib/api';
import { InfoService } from '@/lib/client';
import type { DataResponse, OSInfo, HWInfo, VersionInfo } from '@/lib/client';

export async function getOsInfo(): Promise<OSInfo> {
  const response = await InfoService.getOsInfoEndpointInfoOsGet();
  return response.data as OSInfo;
}

export async function getHwInfo(): Promise<HWInfo> {
  const response = await InfoService.getHwInfoEndpointInfoHwGet();
  return response.data as HWInfo;
}

export async function getVersion(): Promise<VersionInfo> {
  const response = await InfoService.getVersionEndpointInfoVersionGet();
  return response.data as VersionInfo;
}