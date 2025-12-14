'use server';

import '@/lib/api';
import { StorageService, SharesService, PackagesService } from '@/lib/client';
import type { 
  DataResponse, 
  StorageStrategy, 
  CreateBtrfsShareRequest,
  DiskListResponse,
  DiskDetailResponse,
  StorageStrategyListResponse,
  StorageStrategyApplyResponse,
  MountRequest,
  SuccessResponse
} from '@/lib/client';

export async function listStorageDevices(): Promise<DiskListResponse> {
  return StorageService.listDevicesStorageDevicesGet();
}

export async function mountPartition(data: MountRequest): Promise<SuccessResponse> {
    const result = await StorageService.mountPartitionStorageMountPost(data);
    // revalidatePath('/storage'); // Ideally revalidate relevant paths
    return result;
}

export async function listStorageStrategies(): Promise<StorageStrategyListResponse> {
  return StorageService.listStrategiesStorageStrategiesGet();
}

export async function getDiskDetails(deviceName: string): Promise<DiskDetailResponse> {
  return StorageService.getDeviceDetailsStorageDevicesDeviceNameGet(deviceName);
}

export async function listBtrfsVolumes(): Promise<DataResponse> {
  return SharesService.listBtrfsVolumesEndpointSharesBtrfsVolumesGet();
}

export async function listBtrfsShares(): Promise<DataResponse> {
  return SharesService.listBtrfsSharesEndpointSharesBtrfsSharesGet();
}

export async function createBtrfsShare(data: CreateBtrfsShareRequest): Promise<DataResponse> {
  return SharesService.createBtrfsShareEndpointSharesBtrfsSharesPost(data);
}

export async function applyStorageStrategy(strategy: StorageStrategy): Promise<StorageStrategyApplyResponse> {
  return StorageService.applyStrategyStorageApplyPost(strategy);
}

export async function checkRequiredPackages(): Promise<DataResponse> {
  return PackagesService.listRequiredPackagesPkgsRequiredGet();
}