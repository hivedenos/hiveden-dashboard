export function getHttpBaseUrl() {
    if (typeof window === 'undefined') return 'http://localhost:8000'; // Fallback for server-side
    const protocol = window.location.protocol;
    return `${protocol}//${window.location.hostname}:8000`; // Assuming API is on port 8000
}

export function getWebSocketUrl() {
    if (typeof window === 'undefined') return 'ws://localhost:8000'; // Fallback
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // API is assumed to be on port 8000 on the same hostname
    return `${protocol}//${window.location.hostname}:8000`;
}

export function connectToSession(sessionId: string): WebSocket {
    const wsUrl = getWebSocketUrl();
    return new WebSocket(`${wsUrl}/shell/ws/${sessionId}`);
}

export function connectToPackageInstall(packageName: string, packageManager: string = "auto"): WebSocket {
    const wsUrl = getWebSocketUrl();
    return new WebSocket(`${wsUrl}/shell/ws/packages/install?package_name=${packageName}&package_manager=${packageManager}`);
}
