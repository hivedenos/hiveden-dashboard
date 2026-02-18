'use server';

import '@/lib/api';
import { revalidatePath } from 'next/cache';
import { AppStoreService, DockerService } from '@/lib/client';
import type { AppAdoptRequest, AppInstallRequest, AppUninstallRequest, ContainerListResponse } from '@/lib/client';

export async function listApps(params?: {
  q?: string;
  category?: string;
  installed?: boolean;
  limit?: number;
  offset?: number;
}) {
  return AppStoreService.listAppsAppStoreAppsGet(
    params?.q ?? null,
    params?.category ?? null,
    typeof params?.installed === 'boolean' ? params.installed : null,
    params?.limit ?? 50,
    params?.offset,
  );
}

export async function listInstalledApps() {
  return AppStoreService.listInstalledAppsAppStoreInstalledGet();
}

export async function getAppDetail(appId: string) {
  return AppStoreService.getAppDetailAppStoreAppsAppIdGet(appId);
}

export async function syncAppCatalog() {
  const result = await AppStoreService.syncCatalogAppStoreSyncPost();
  revalidatePath('/app-store');
  return result;
}

export async function installApp(appId: string, payload?: AppInstallRequest) {
  const result = await AppStoreService.installAppAppStoreAppsAppIdInstallPost(appId, payload ?? {});
  revalidatePath('/app-store');
  return result;
}

export async function listContainersForAdoption(): Promise<ContainerListResponse> {
  return DockerService.listAllContainersDockerContainersGet();
}

export async function adoptAppContainers(appId: string, payload?: AppAdoptRequest) {
  const result = await AppStoreService.adoptExistingAppContainersAppStoreAppsAppIdAdoptPost(appId, payload ?? {});
  revalidatePath('/app-store');
  revalidatePath(`/app-store/${encodeURIComponent(appId)}`);
  return result;
}

export async function uninstallApp(appId: string, payload?: AppUninstallRequest) {
  const result = await AppStoreService.uninstallAppAppStoreAppsAppIdUninstallPost(appId, payload ?? {});
  revalidatePath('/app-store');
  return result;
}

export async function getComposePreview(composeUrl: string) {
  let url: URL;

  try {
    url = new URL(composeUrl);
  } catch {
    throw new Error('Invalid compose URL');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Unsupported compose URL protocol');
  }

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'text/plain, text/yaml, text/x-yaml, application/x-yaml, */*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compose file (${response.status})`);
  }

  const rawContent = await response.text();
  if (!rawContent.trim()) {
    throw new Error('Compose file is empty');
  }

  const maxPreviewLength = 200000;
  const truncated = rawContent.length > maxPreviewLength;
  const content = truncated
    ? `${rawContent.slice(0, maxPreviewLength)}\n\n# Preview truncated due to file size.`
    : rawContent;

  return {
    content,
    truncated,
  };
}
