export function resolvePrometheusUrl(explicitUrl?: string): string {
  const configured = explicitUrl?.trim() || '';
  if (!configured) {
    return '';
  }

  if (configured.startsWith('http://') || configured.startsWith('https://')) {
    return configured.replace(/\/$/, '');
  }

  return `http://${configured.replace(/\/$/, '')}`;
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
