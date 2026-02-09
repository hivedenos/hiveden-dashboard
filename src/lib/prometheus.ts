export function resolvePrometheusUrl(explicitUrl?: string): string {
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl;
  }

  const envUrl = process.env.NEXT_PUBLIC_PROMETHEUS_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:9090';
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  let targetDomain = hostname;

  if (hostname.startsWith('dashboard.')) {
    targetDomain = hostname.replace('dashboard.', 'prometheus.');
  } else if (hostname.startsWith('www.')) {
    targetDomain = hostname.replace('www.', 'prometheus.');
  } else {
    targetDomain = `prometheus.${hostname}`;
  }

  return `${protocol}//${targetDomain}`;
}

export function normalizeContainerName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/^\/+/, '').trim().toLowerCase();
}

export function buildContainerRegex(name: string | null | undefined): string {
  const normalized = normalizeContainerName(name);
  if (!normalized) {
    return '.*';
  }

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `^/?${escaped}$`;
}
