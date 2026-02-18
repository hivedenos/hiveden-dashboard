"use server";

import "@/lib/api";
import { ShellService, ShellType } from "@/lib/client";

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
  const shellTypeMap: Record<ShellSession["shell_type"], ShellType> = {
    docker: ShellType.DOCKER,
    ssh: ShellType.SSH,
    local: ShellType.LOCAL,
  };

  const response = await ShellService.createShellSessionShellSessionsPost({
    shell_type: shellTypeMap[type],
    target,
    user: options?.user,
    working_dir: options?.working_dir,
  });

  if (!response.data || typeof response.data !== "object" || !("session_id" in response.data)) {
    throw new Error("Failed to create session: Invalid response payload");
  }

  return response.data as ShellSession;
}

export async function createDockerSession(
  containerId: string,
  options?: {
    user?: string;
    working_dir?: string;
  },
): Promise<ShellSession> {
  return createSession("docker", containerId, {
    user: options?.user,
    working_dir: options?.working_dir,
  });
}

export async function createLXCSession(
  containerName: string,
  options?: {
    user?: string;
    working_dir?: string;
  },
): Promise<ShellSession> {
  return createSession("ssh", containerName, {
    user: options?.user,
    working_dir: options?.working_dir,
  });
}

export async function listSessions(): Promise<ShellSession[]> {
  const response = await ShellService.listShellSessionsShellSessionsGet(true);
  return (response.data as ShellSession[]) ?? [];
}

export async function getSession(sessionId: string): Promise<ShellSession> {
  const response = await ShellService.getShellSessionShellSessionsSessionIdGet(sessionId);

  if (!response.data || typeof response.data !== "object" || !("session_id" in response.data)) {
    throw new Error("Failed to get session: Invalid response payload");
  }

  return response.data as ShellSession;
}

export async function closeSession(sessionId: string): Promise<void> {
  await ShellService.closeShellSessionShellSessionsSessionIdDelete(sessionId);
}

export async function checkPackage(packageName: string, packageManager: string = "auto"): Promise<boolean> {
  const response = await ShellService.checkPackageShellPackagesCheckPost({
    package_name: packageName,
    package_manager: packageManager,
  });

  if (!response.data || typeof response.data !== "object" || !("installed" in response.data)) {
    throw new Error("Failed to check package: Invalid response payload");
  }

  return Boolean((response.data as { installed?: boolean }).installed);
}
