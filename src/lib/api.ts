import { OpenAPI } from './client';

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '');
}

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  if (typeof window !== 'undefined') {
    return normalizeBaseUrl(`${window.location.protocol}//${window.location.hostname}:8000`);
  }

  return 'http://localhost:8000';
}

const API_BASE_URL = getApiBaseUrl();

// Configure generated client
OpenAPI.BASE = API_BASE_URL;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}
