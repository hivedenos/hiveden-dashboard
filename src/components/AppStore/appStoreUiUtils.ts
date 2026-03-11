import type { AppDetail, AppSummary } from "@/lib/client";

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

export function formatChannelLabel(channel?: string | null, channelLabel?: string | null): string {
  if (channelLabel) return channelLabel;
  if (!channel) return "Unknown";

  return channel
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getChannelColor(channel?: string | null): string {
  switch (channel) {
    case "stable":
      return "teal";
    case "beta":
      return "blue";
    case "edge":
      return "orange";
    case "incubator":
      return "grape";
    default:
      return "gray";
  }
}

export function getPromotionStatusLabel(status?: string | null): string | null {
  if (!status) return null;

  return status
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isIncubatorApp(channel?: string | null): boolean {
  return channel === "incubator";
}

const PROMOTE_APP_TEMPLATE = "promote-app.yaml";
const PROMOTE_APP_ISSUES_URL = "https://github.com/hivedenos/hivedenos-apps/issues/new";

export function buildPromoteAppIssueUrl(app: AppSummary | AppDetail): string {
  const params = new URLSearchParams({
    template: PROMOTE_APP_TEMPLATE,
    title: `Promote: ${app.title}`,
    labels: "promote-app",
    "app-name": app.title,
    "incubator-channel": formatChannelLabel(app.channel, app.channel_label),
  });

  if (app.description) params.set("description", app.description);

  const extraInfo = [
    app.catalog_id ? `Catalog ID: ${app.catalog_id}` : null,
    app.app_id ? `App ID: ${app.app_id}` : null,
    app.origin_channel ? `Origin Channel: ${formatChannelLabel(app.origin_channel)}` : null,
    app.version ? `Version: ${app.version}` : null,
    app.repository_path ? `Repository Path: ${app.repository_path}` : null,
    app.compose_url ? `Compose URL: ${app.compose_url}` : null,
    "manifest_url" in app && app.manifest_url ? `Manifest URL: ${app.manifest_url}` : null,
    "repo" in app && app.repo ? `Repository: ${app.repo}` : null,
    "website" in app && app.website ? `Website: ${app.website}` : null,
    "support" in app && app.support ? `Support: ${app.support}` : null,
    app.install_block_reason ? `Install Block Reason: ${app.install_block_reason}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (extraInfo) params.set("extra-info", extraInfo);

  return `${PROMOTE_APP_ISSUES_URL}?${params.toString()}`;
}
