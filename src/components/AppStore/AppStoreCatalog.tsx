"use client";

import { clearCatalogCache, listApps, listInstalledApps, syncAppCatalog } from "@/actions/app-store";
import { Terminal } from "@/components/Terminal/Terminal";
import type { AppSummary } from "@/lib/client";
import { getWebSocketUrl } from "@/lib/shellClient";
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconApps,
  IconBolt,
  IconCheck,
  IconClockHour4,
  IconExternalLink,
  IconFlask,
  IconLayersSubtract,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildPromoteAppIssueUrl,
  formatChannelLabel,
  getChannelColor,
  getErrorMessage,
  getPromotionStatusLabel,
  isIncubatorApp,
} from "./appStoreUiUtils";

interface AppStoreCatalogProps {
  initialApps: AppSummary[];
}

type AppStoreView = "catalog" | "installed";

const PAGE_SIZE = 24;
const CHANNEL_OPTIONS = ["stable", "beta", "edge", "incubator"];

export function AppStoreCatalog({ initialApps }: AppStoreCatalogProps) {
  const [apps, setApps] = useState<AppSummary[]>(initialApps.slice(0, PAGE_SIZE));
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 350);
  const [category, setCategory] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);
  const [view, setView] = useState<AppStoreView>("catalog");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialApps.length >= PAGE_SIZE);
  const [loadingApps, setLoadingApps] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);
  const [syncAfterClear, setSyncAfterClear] = useState(true);

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalJobId, setTerminalJobId] = useState<string | null>(null);
  const [terminalTitle, setTerminalTitle] = useState("Running app operation");

  const [allCategories, setAllCategories] = useState<string[]>(() => extractCategories(initialApps));
  const [allChannels, setAllChannels] = useState<string[]>(() => extractChannels(initialApps));
  const [installedSource, setInstalledSource] = useState<AppSummary[]>([]);
  const filteredInstalledCount = useMemo(
    () => filterInstalledApps(installedSource, debouncedQuery, category, channel).length,
    [installedSource, debouncedQuery, category, channel],
  );
  const incubatorCount = useMemo(() => apps.filter((app) => isIncubatorApp(app.channel)).length, [apps]);

  useEffect(() => {
    setPage(1);
  }, [view, debouncedQuery, category, channel]);

  const loadApps = useCallback(async () => {
    setLoadingApps(true);

    try {
      if (view === "catalog") {
        const response = await listApps({
          q: debouncedQuery || undefined,
          category: category || undefined,
          channel: channel || undefined,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });

        const pageItems = response.data || [];
        setApps(pageItems);
        setHasNextPage(pageItems.length === PAGE_SIZE);
        setAllCategories((previous) => mergeCategories(previous, pageItems));
        setAllChannels((previous) => mergeChannels(previous, pageItems));
        return;
      }

      const response = await listInstalledApps();
      const installedApps = response.data || [];
      const filteredInstalledApps = filterInstalledApps(installedApps, debouncedQuery, category, channel);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      setInstalledSource(installedApps);
      setApps(filteredInstalledApps.slice(start, end));
      setHasNextPage(end < filteredInstalledApps.length);
      setAllCategories((previous) => mergeCategories(previous, installedApps));
      setAllChannels((previous) => mergeChannels(previous, installedApps));
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to load app catalog"),
        color: "red",
      });
      setApps([]);
      setHasNextPage(false);
    } finally {
      setLoadingApps(false);
    }
  }, [view, debouncedQuery, category, channel, page]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const handleSync = async () => {
    setSyncing(true);

    try {
      const response = await syncAppCatalog();
      const jobId = response.data?.job_id;

      notifications.show({
        title: "Catalog sync started",
        message: response.message || "The app store catalog is being refreshed.",
        color: "blue",
      });

      if (jobId) {
        setTerminalJobId(jobId);
        setTerminalTitle("Syncing app catalog");
        setTerminalOpen(true);
      }

      await loadApps();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to sync app catalog"),
        color: "red",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);

    try {
      const response = await clearCatalogCache({ sync_after_clear: syncAfterClear });
      const jobId = response.data?.job_id;
      const clearedEntries = response.data?.cleared_entries ?? 0;

      notifications.show({
        title: "Catalog cache cleared",
        message:
          response.message ||
          `Removed ${clearedEntries} cached entr${clearedEntries === 1 ? "y" : "ies"}${syncAfterClear ? " and started a fresh sync." : "."}`,
        color: "orange",
      });

      setClearCacheModalOpen(false);

      if (jobId) {
        setTerminalJobId(jobId);
        setTerminalTitle(syncAfterClear ? "Clearing cache and syncing catalog" : "Clearing app catalog cache");
        setTerminalOpen(true);
      }

      await loadApps();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to clear catalog cache"),
        color: "red",
      });
    } finally {
      setClearingCache(false);
    }
  };

  const appJobSocketFactory = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(`${wsUrl}/shell/ws/jobs/${terminalJobId}`);

    ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === "job_completed") {
          setTimeout(() => {
            loadApps();
          }, 700);
        }
      } catch {
        // ignore non-JSON payloads
      }
    });

    return ws;
  }, [terminalJobId, loadApps]);

  const installedCount = apps.filter((app) => app.installed).length;
  const categoryOptions = allCategories.map((value) => ({ value, label: value }));
  const channelOptions = allChannels.map((value) => ({ value, label: formatChannelLabel(value) }));
  const groupedApps = groupAppsByChannel(apps);

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Showing Apps
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {apps.length}
              </Text>
            </Box>
            <ThemeIcon variant="light" color="blue" radius="xl">
              <IconApps size={16} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Installed in View
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {view === "installed" ? filteredInstalledCount : installedCount}
              </Text>
            </Box>
            <ThemeIcon variant="light" color="green" radius="xl">
              <IconCheck size={16} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Channels in View
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {apps.length === 0 ? 0 : new Set(apps.map((app) => app.channel || "unknown")).size}
              </Text>
            </Box>
            <ThemeIcon variant="light" color="grape" radius="xl">
              <IconFlask size={16} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Incubator Apps
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {incubatorCount}
              </Text>
            </Box>
            <ThemeIcon variant="light" color="orange" radius="xl">
              <IconClockHour4 size={16} />
            </ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>

      <Paper withBorder radius="md" p="sm">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Group>
            <Box>
              <Text size="sm" fw={600} mb={4}>
                View
              </Text>
              <SegmentedControl
                value={view}
                onChange={(value) => setView(value as AppStoreView)}
                data={[
                  { value: "catalog", label: "Catalog" },
                  { value: "installed", label: "Installed" },
                ]}
              />
            </Box>

            <TextInput
              label="Search"
              placeholder="Title, description, developer"
              leftSection={<IconSearch size={16} />}
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              w={260}
            />

            <Select
              label="Category"
              placeholder="All categories"
              clearable
              data={categoryOptions}
              value={category}
              onChange={setCategory}
              w={180}
            />

            <Select
              label="Channel"
              placeholder="All channels"
              clearable
              data={channelOptions}
              value={channel}
              onChange={setChannel}
              w={180}
            />
          </Group>

          <Group gap="xs">
            <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={loadApps} loading={loadingApps}>
              Refresh
            </Button>
            <Button leftSection={<IconBolt size={16} />} onClick={handleSync} loading={syncing}>
              Sync Catalog
            </Button>
            <Button
              variant="light"
              color="orange"
              leftSection={<IconLayersSubtract size={16} />}
              onClick={() => setClearCacheModalOpen(true)}
            >
              Clear Cache
            </Button>
          </Group>
        </Group>
      </Paper>

      <Alert color="blue" variant="light" title="Channel-aware catalog">
        Stable, beta, and edge apps can be installed when eligible. Incubator apps stay visible for discovery but require a promotion request before they can be installed.
      </Alert>

      <Box pos="relative">
        <LoadingOverlay visible={loadingApps} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />

        <Stack gap="md">
          {groupedApps.map(({ channel: appChannel, items }) => (
            <Stack key={appChannel} gap="xs">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <Badge variant="light" color={getChannelColor(appChannel)} size="lg">
                    {formatChannelLabel(appChannel)}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {items.length} {items.length === 1 ? "app" : "apps"}
                  </Text>
                </Group>
                {appChannel === "incubator" && (
                  <Text size="sm" c="grape.7" fw={500}>
                    Visible for review, promotion required before install
                  </Text>
                )}
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                {items.map((app) => (
                  <Paper key={app.catalog_id || `${app.app_id}-${app.channel || "unknown"}`} withBorder radius="md" p="sm">
                    <UnstyledButton
                      component={Link}
                      href={`/app-store/${encodeURIComponent(app.app_id)}`}
                      style={{ display: "block" }}
                      aria-label={`Open details for ${app.title}`}
                    >
                      <Group align="flex-start" wrap="nowrap" gap="sm">
                        <Avatar src={app.icon_url || app.icon || undefined} radius="md" color="blue" size={36}>
                          {app.title?.charAt(0)?.toUpperCase() || "A"}
                        </Avatar>
                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                            <Text fw={600} lineClamp={1}>
                              {app.title}
                            </Text>
                            <Badge
                              variant="light"
                              color={app.installed ? "green" : "orange"}
                              style={{ flexShrink: 0 }}
                            >
                              {app.installed ? "Installed" : "Not installed"}
                            </Badge>
                          </Group>
                          <Group gap={6} mt={6}>
                            <Badge variant="light" color={getChannelColor(app.channel)}>
                              {formatChannelLabel(app.channel, app.channel_label)}
                            </Badge>
                            {app.origin_channel && (
                              <Badge variant="outline" color="gray">
                                From {formatChannelLabel(app.origin_channel)}
                              </Badge>
                            )}
                            {app.risk_level && (
                              <Badge variant="outline" color="red">
                                {app.risk_level}
                              </Badge>
                            )}
                            {app.promotion_request_status && (
                              <Badge variant="outline" color="grape">
                                {getPromotionStatusLabel(app.promotion_request_status)}
                              </Badge>
                            )}
                          </Group>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {app.tagline || app.description || "No tagline available."}
                          </Text>
                          <Text size="xs" c={app.installable === false ? "orange.7" : "dimmed"} mt={6}>
                            {app.installable === false
                              ? app.install_block_reason ||
                                (isIncubatorApp(app.channel)
                                  ? "This incubator app must be promoted before installation."
                                  : "Installation is currently blocked for this app.")
                              : isIncubatorApp(app.channel)
                                ? "Incubator app visible for review."
                                : `Ready in ${formatChannelLabel(app.channel, app.channel_label)} channel.`}
                          </Text>
                        </Box>
                      </Group>
                    </UnstyledButton>

                    {isIncubatorApp(app.channel) && (
                      <Group justify="flex-end" mt="sm">
                        <ActionIcon
                          component="a"
                          href={buildPromoteAppIssueUrl(app)}
                          variant="light"
                          color="grape"
                          size="lg"
                          aria-label={`Promote ${app.title} via GitHub`}
                        >
                          <IconExternalLink size={16} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Paper>
                ))}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>

        {apps.length === 0 && !loadingApps && (
          <Alert title="No apps found" color="blue" variant="light" mt="md">
            Try changing filters or syncing the catalog.
          </Alert>
        )}
      </Box>

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Page {page}
        </Text>
        <Group gap="xs">
          <Button
            variant="default"
            disabled={loadingApps || page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            variant="default"
            disabled={loadingApps || !hasNextPage}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </Group>
      </Group>

      <Modal
        opened={clearCacheModalOpen}
        onClose={() => setClearCacheModalOpen(false)}
        title="Clear app catalog cache"
        centered
      >
        <Stack gap="md">
          <Alert color="orange" variant="light" title="This clears cached app metadata">
            Use this when the catalog looks stale or you need to force a fresh fetch from upstream sources.
          </Alert>

          <Checkbox
            checked={syncAfterClear}
            onChange={(event) => setSyncAfterClear(event.currentTarget.checked)}
            label="Sync catalog immediately after clearing cache"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setClearCacheModalOpen(false)}>
              Cancel
            </Button>
            <Button color="orange" onClick={handleClearCache} loading={clearingCache}>
              Clear cache
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        title={terminalTitle}
        size="xl"
        closeOnClickOutside={false}
      >
        {terminalJobId && (
          <Box h={480}>
            <Terminal socketFactory={appJobSocketFactory} mode="stream" onClose={() => setTerminalOpen(false)} title={terminalTitle} />
          </Box>
        )}
      </Modal>
    </Stack>
  );
}

function extractCategories(apps: AppSummary[]): string[] {
  return Array.from(new Set(apps.map((app) => app.category).filter((value): value is string => !!value))).sort();
}

function extractChannels(apps: AppSummary[]): string[] {
  const discovered = new Set(CHANNEL_OPTIONS);

  for (const channel of apps.map((app) => app.channel).filter((value): value is string => !!value)) {
    discovered.add(channel);
  }

  return Array.from(discovered);
}

function mergeCategories(current: string[], apps: AppSummary[]): string[] {
  const merged = new Set(current);
  for (const category of extractCategories(apps)) {
    merged.add(category);
  }
  return Array.from(merged).sort();
}

function mergeChannels(current: string[], apps: AppSummary[]): string[] {
  const merged = new Set(current);
  for (const channel of extractChannels(apps)) {
    merged.add(channel);
  }

  return Array.from(merged);
}

function groupAppsByChannel(apps: AppSummary[]): Array<{ channel: string; items: AppSummary[] }> {
  const grouped = new Map<string, AppSummary[]>();

  for (const app of apps) {
    const channel = app.channel || "unknown";
    const items = grouped.get(channel) || [];
    items.push(app);
    grouped.set(channel, items);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => getChannelSortIndex(left) - getChannelSortIndex(right) || left.localeCompare(right))
    .map(([channel, items]) => ({
      channel,
      items: items.sort((left, right) => left.title.localeCompare(right.title)),
    }));
}

function getChannelSortIndex(channel: string): number {
  const index = CHANNEL_OPTIONS.indexOf(channel);
  return index === -1 ? CHANNEL_OPTIONS.length : index;
}

function filterInstalledApps(apps: AppSummary[], query: string, category: string | null, channel: string | null): AppSummary[] {
  const normalizedQuery = query.trim().toLowerCase();

  return apps.filter((app) => {
    const matchesCategory = !category || app.category === category;
    if (!matchesCategory) return false;

    const matchesChannel = !channel || app.channel === channel;
    if (!matchesChannel) return false;

    if (!normalizedQuery) return true;

    const haystack = [app.title, app.tagline, app.description, app.developer, app.category, app.channel, app.channel_label]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
