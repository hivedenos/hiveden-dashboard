'use server';

import '@/lib/api';
import { revalidatePath } from 'next/cache';
import { AppStoreService, DockerService } from '@/lib/client';
import type {
  AppAdoptRequest,
  AppCacheClearRequest,
  AppInstallRequest,
  AppPromotionRequestCreate,
  AppUninstallRequest,
  ContainerListResponse,
} from '@/lib/client';

function buildComposePreviewCandidates(composeUrl: URL) {
  const candidates = [composeUrl.toString()];

  if (composeUrl.hostname !== 'raw.githubusercontent.com') {
    return candidates;
  }

  const segments = composeUrl.pathname.split('/').filter(Boolean);
  if (segments.length < 6) {
    return candidates;
  }

  const filename = segments[segments.length - 1];
  const directorySegments = segments.slice(0, -1);

  for (let duplicateLength = Math.floor(directorySegments.length / 2); duplicateLength >= 1; duplicateLength -= 1) {
    const prefix = directorySegments.slice(0, -duplicateLength * 2);
    const firstDuplicate = directorySegments.slice(-duplicateLength * 2, -duplicateLength);
    const secondDuplicate = directorySegments.slice(-duplicateLength);

    if (firstDuplicate.join('/') !== secondDuplicate.join('/')) {
      continue;
    }

    const deduplicatedUrl = new URL(composeUrl.toString());
    deduplicatedUrl.pathname = `/${[...prefix, ...secondDuplicate, filename].join('/')}`;
    candidates.push(deduplicatedUrl.toString());
    break;
  }

  return candidates;
}

export async function listApps(params?: {
  q?: string;
  category?: string;
  channel?: string;
  installed?: boolean;
  limit?: number;
  offset?: number;
}) {
  return AppStoreService.listAppsAppStoreAppsGet(
    params?.q ?? null,
    params?.category ?? null,
    params?.channel ?? null,
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

export async function requestAppPromotion(appId: string, payload?: AppPromotionRequestCreate) {
  const result = await AppStoreService.requestAppPromotionAppStoreAppsAppIdPromotionRequestPost(appId, payload ?? {});
  revalidatePath('/app-store');
  revalidatePath(`/app-store/${encodeURIComponent(appId)}`);
  return result;
}

export async function clearCatalogCache(payload?: AppCacheClearRequest) {
  const result = await AppStoreService.clearCatalogCacheAppStoreCacheClearPost(payload ?? {});
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

  const requestOptions = {
    cache: 'no-store' as const,
    headers: {
      Accept: 'text/plain, text/yaml, text/x-yaml, application/x-yaml, */*;q=0.8',
    },
  };

  let response: Response | null = null;
  let failureStatus: number | null = null;

  for (const candidateUrl of buildComposePreviewCandidates(url)) {
    const candidateResponse = await fetch(candidateUrl, requestOptions);

    if (candidateResponse.ok) {
      response = candidateResponse;
      break;
    }

    failureStatus = candidateResponse.status;
  }

  if (!response) {
    throw new Error(`Failed to fetch compose file (${failureStatus ?? 'unknown'})`);
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
