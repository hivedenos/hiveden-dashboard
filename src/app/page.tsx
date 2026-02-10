import { Container, Title } from '@mantine/core';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { getSystemDomain } from '@/actions/system';
import { listContainers } from '@/actions/docker';
import type { Container as DockerContainer, IngressContainerInfo } from '@/lib/client';

export const dynamic = 'force-dynamic';

function extractHostsFromRule(rule: string): string[] {
  const hosts: string[] = [];
  const hostFnPattern = /Host\(([^)]*)\)/g;
  let hostFnMatch: RegExpExecArray | null;

  while ((hostFnMatch = hostFnPattern.exec(rule)) !== null) {
    const args = hostFnMatch[1] ?? '';
    const quotedHostPattern = /`([^`]+)`|'([^']+)'|"([^"]+)"/g;
    let quotedMatch: RegExpExecArray | null;

    while ((quotedMatch = quotedHostPattern.exec(args)) !== null) {
      const host = (quotedMatch[1] ?? quotedMatch[2] ?? quotedMatch[3] ?? '').trim();
      if (host.length > 0) hosts.push(host);
    }
  }

  return hosts;
}

function resolveUrlFromTraefikHost(host: string, entrypoints?: string): string {
  const normalizedHost = host.trim();
  if (!normalizedHost) return '';

  const normalizedEntrypoints = (entrypoints || '').toLowerCase();
  if (normalizedEntrypoints.includes('websecure')) {
    return `https://${normalizedHost}`;
  }
  if (normalizedEntrypoints.includes('web')) {
    return `http://${normalizedHost}`;
  }

  return `//${normalizedHost}`;
}

function toIngressCandidatesFromContainer(container: DockerContainer): IngressContainerInfo[] {
  const labels = container.Labels || {};
  const name = (container.Name || '').replace(/^\/+/, '') || container.Id;
  const candidates: IngressContainerInfo[] = [];

  for (const [key, value] of Object.entries(labels)) {
    if (!key.startsWith('traefik.http.routers.') || !key.endsWith('.rule') || typeof value !== 'string') {
      continue;
    }

    const routerName = key.slice('traefik.http.routers.'.length, -'.rule'.length);
    const entrypoints = labels[`traefik.http.routers.${routerName}.entrypoints`];
    const hosts = extractHostsFromRule(value);

    for (const host of hosts) {
      const url = resolveUrlFromTraefikHost(host, typeof entrypoints === 'string' ? entrypoints : undefined);
      if (!url) continue;
      candidates.push({
        id: container.Id,
        name,
        url,
      });
    }
  }

  return candidates;
}

export default async function Home() {
  let applications: IngressContainerInfo[] = [];

  try {
    const [domainResult, containersResult] = await Promise.allSettled([
      getSystemDomain(),
      listContainers(),
    ]);

    const appById = new Map<string, IngressContainerInfo>();

    if (domainResult.status === 'fulfilled') {
      for (const app of domainResult.value.containers || []) {
        appById.set(app.id, app);
      }
    } else {
      console.error('Failed to fetch accessible applications from /system/domain:', domainResult.reason);
    }

    if (containersResult.status === 'fulfilled') {
      const containers = (containersResult.value.data as DockerContainer[]) || [];
      for (const container of containers) {
        if (appById.has(container.Id)) continue;
        const candidates = toIngressCandidatesFromContainer(container);
        if (candidates.length > 0) {
          appById.set(container.Id, candidates[0]);
        }
      }
    } else {
      console.error('Failed to fetch Docker containers for Traefik labels:', containersResult.reason);
    }

    applications = Array.from(appById.values());
  } catch (error) {
    console.error('Failed to fetch accessible applications:', error);
  }

  return (
    <Container fluid>
      <Title order={2} mb="lg">System Overview</Title>
      <DashboardLayout applications={applications} />
    </Container>
  );
}
