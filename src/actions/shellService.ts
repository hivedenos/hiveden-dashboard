"use service";

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

export class ShellService {
  private baseUrl: string;
  private wsUrl: string;

  constructor(baseUrl: string = "http://localhost:8000") {
    this.baseUrl = baseUrl;
    this.wsUrl = baseUrl.replace("http://", "ws://").replace("https://", "wss://");
  }

  async createSession(
    type: "local" | "ssh" | "docker",
    target: string,
    options?: {
      user?: string;
      working_dir?: string;
    },
  ): Promise<ShellSession> {
    const response = await fetch(`${this.baseUrl}/shell/sessions`, {
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

  async createDockerSession(
    containerId: string,
    options?: {
      user?: string;
      working_dir?: string;
    },
  ): Promise<ShellSession> {
    const response = await fetch(`${this.baseUrl}/shell/docker/${containerId}/shell`, {
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

  async createLXCSession(
    containerName: string,
    options?: {
      user?: string;
      working_dir?: string;
    },
  ): Promise<ShellSession> {
    const response = await fetch(`${this.baseUrl}/shell/lxc/${containerName}/shell`, {
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

  async listSessions(): Promise<ShellSession[]> {
    const response = await fetch(`${this.baseUrl}/shell/sessions`);

    if (!response.ok) {
      throw new Error(`Failed to list sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getSession(sessionId: string): Promise<ShellSession> {
    const response = await fetch(`${this.baseUrl}/shell/sessions/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async closeSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/shell/sessions/${sessionId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to close session: ${response.statusText}`);
    }
  }

  async checkPackage(packageName: string, packageManager: string = "auto"): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/shell/packages/check`, {
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

  connectToSession(sessionId: string): WebSocket {
    return new WebSocket(`${this.wsUrl}/shell/ws/${sessionId}`);
  }

  connectToPackageInstall(packageName: string, packageManager: string = "auto"): WebSocket {
    return new WebSocket(`${this.wsUrl}/shell/ws/packages/install?package_name=${packageName}&package_manager=${packageManager}`);
  }
}
