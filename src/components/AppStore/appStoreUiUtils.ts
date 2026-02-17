export function parseEnvOverrides(input: string): Record<string, string> | null {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return null;

  const env: Record<string, string> = {};

  for (const line of lines) {
    if (line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      throw new Error(`Invalid environment override: "${line}". Use KEY=value format.`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key) {
      throw new Error(`Invalid environment override: "${line}". Key cannot be empty.`);
    }

    env[key] = value;
  }

  return Object.keys(env).length > 0 ? env : null;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
