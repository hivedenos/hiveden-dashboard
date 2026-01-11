'use server';

import { revalidatePath } from 'next/cache';
import '@/lib/api';
import { SharesService } from '@/lib/client';
import type { 
  DataResponse, 
  SMBShareCreate, 
  ZFSPoolCreate, 
  ZFSDatasetCreate,
  SuccessResponse 
} from '@/lib/client';

export async function listZfsPools(): Promise<DataResponse> {
  return SharesService.listZfsPoolsEndpointSharesZfsPoolsGet();
}

export async function createZfsPool(pool: ZFSPoolCreate): Promise<SuccessResponse> {
  const result = await SharesService.createZfsPoolEndpointSharesZfsPoolsPost(pool);
  revalidatePath('/shares');
  return result;
}

export async function destroyZfsPool(name: string): Promise<SuccessResponse> {
  const result = await SharesService.destroyZfsPoolEndpointSharesZfsPoolsNameDelete(name);
  revalidatePath('/shares');
  return result;
}

export async function listZfsDatasets(pool: string): Promise<DataResponse> {
  return SharesService.listZfsDatasetsEndpointSharesZfsDatasetsPoolGet(pool);
}

export async function createZfsDataset(dataset: ZFSDatasetCreate): Promise<SuccessResponse> {
  const result = await SharesService.createZfsDatasetEndpointSharesZfsDatasetsPost(dataset);
  revalidatePath('/shares');
  return result;
}

export async function destroyZfsDataset(name: string): Promise<SuccessResponse> {
  const result = await SharesService.destroyZfsDatasetEndpointSharesZfsDatasetsNameDelete(name);
  revalidatePath('/shares');
  return result;
}

export async function listAvailableDevices(): Promise<DataResponse> {
  return SharesService.listAvailableDevicesEndpointSharesZfsAvailableDevicesGet();
}

export async function listSmbShares(): Promise<import('@/lib/client').SMBListResponse> {
  return SharesService.listSmbSharesEndpointSharesSmbGet();
}

export async function createSmbShare(share: SMBShareCreate): Promise<SuccessResponse> {
  const result = await SharesService.createSmbShareEndpointSharesSmbPost(share);
  revalidatePath('/shares');
  return result;
}

export async function deleteSmbShare(name: string): Promise<SuccessResponse> {
  const result = await SharesService.destroySmbShareEndpointSharesSmbNameDelete(name);
  revalidatePath('/shares');
  return result;
}

export async function mountSmbShare(data: import('@/lib/client').MountSMBShareRequest): Promise<SuccessResponse> {
  const result = await SharesService.mountSmbShareEndpointSharesSmbMountPost(data);
  revalidatePath('/shares');
  return result;
}

export async function unmountSmbShare(mountPoint: string, removePersistence: boolean = false, force: boolean = false): Promise<SuccessResponse> {
  const result = await SharesService.unmountSmbShareEndpointSharesSmbMountDelete(mountPoint, removePersistence, force);
  revalidatePath('/shares');
  return result;
}