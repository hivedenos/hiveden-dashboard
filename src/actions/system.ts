'use server';

import '@/lib/api';
import { SystemService } from '@/lib/client';
import type { 
  DomainInfoResponse, 
  DomainUpdateRequest, 
  DomainUpdateResponse, 
  LocationListResponse, 
  SuccessResponse, 
  UpdateLocationRequest,
  DNSConfigResponse,
  DNSUpdateRequest,
  MetricsConfigResponse
} from '@/lib/client';
import { revalidatePath } from 'next/cache';

export async function getSystemDomain(): Promise<DomainInfoResponse> {
  return SystemService.getSystemDomainSystemDomainGet();
}

export async function getDnsConfig(): Promise<DNSConfigResponse> {
  return SystemService.getDnsConfigSystemDnsGet();
}

export async function updateDnsConfig(request: DNSUpdateRequest): Promise<SuccessResponse> {
  const response = await SystemService.updateDnsConfigSystemDnsPut(request);
  revalidatePath('/system');
  return response;
}

export async function updateSystemDomain(request: DomainUpdateRequest): Promise<DomainUpdateResponse> {
  const response = await SystemService.updateSystemDomainSystemDomainPut(request);
  revalidatePath('/system');
  return response;
}

export async function getSystemLocations(): Promise<LocationListResponse> {
  return SystemService.getSystemLocationsSystemLocationsGet();
}

export async function getComprehensiveLocations(): Promise<LocationListResponse> {
  return SystemService.getComprehensiveLocationsSystemLocationsTreeGet();
}

export async function getMetricsConfig(): Promise<MetricsConfigResponse> {
  return SystemService.getMetricsConfigSystemMetricsGet();
}

export async function updateSystemLocation(key: string, request: UpdateLocationRequest): Promise<SuccessResponse> {
  const response = await SystemService.updateSystemLocationSystemLocationsKeyPut(key, request);
  revalidatePath('/system');
  return response;
}
