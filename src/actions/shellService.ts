"use server";

const BASE_URL = "http://localhost:8000";

export interface ShellSession {
  session_id: string;
  shell_type: "docker" | "ssh" | "local";
  target: string;
  user: string;
  working_dir: string;
  active: boolean;
  created_at: string;
}

export interface ShellOutput {
  session_id: string;
  output: string;
  error: boolean;
  exit_code: number | null;
  timestamp: string;
}

export async function createSession(
  type: "local" | "ssh" | "docker",
  target: string,
  options?: {
    user?: string;
    working_dir?: string;
  },
): Promise<ShellSession> {
  const response = await fetch(`${BASE_URL}/shell/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, target, ...options }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function createDockerSession(
  containerId: string,
  options?: {
    user?: string;
    working_dir?: string;
  },
): Promise<ShellSession> {
  const response = await fetch(`${BASE_URL}/shell/docker/${containerId}/shell`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function createLXCSession(
  containerName: string,
  options?: {
    user?: string;
    working_dir?: string;
  },
): Promise<ShellSession> {
  const response = await fetch(`${BASE_URL}/shell/lxc/${containerName}/shell`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    throw new Error(`Failed to create LXC session: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function listSessions(): Promise<ShellSession[]> {
  const response = await fetch(`${BASE_URL}/shell/sessions`);

  if (!response.ok) {
    throw new Error(`Failed to list sessions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function getSession(sessionId: string): Promise<ShellSession> {
  const response = await fetch(`${BASE_URL}/shell/sessions/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function closeSession(sessionId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/shell/sessions/${sessionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to close session: ${response.statusText}`);
  }
}

export async function checkPackage(packageName: string, packageManager: string = "auto"): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/shell/packages/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_name: packageName, package_manager: packageManager }),
  });

  if (!response.ok) {
    throw new Error(`Failed to check package: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.installed;
}