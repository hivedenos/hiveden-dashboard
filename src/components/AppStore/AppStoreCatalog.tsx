"use client";

import { listApps, listInstalledApps, syncAppCatalog } from "@/actions/app-store";
import { Terminal } from "@/components/Terminal/Terminal";
import type { AppSummary } from "@/lib/client";
import { getWebSocketUrl } from "@/lib/shellClient";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
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
import { IconApps, IconBolt, IconCheck, IconClockHour4, IconRefresh, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "./appStoreUiUtils";

interface AppStoreCatalogProps {
  initialApps: AppSummary[];
}

type AppStoreView = "catalog" | "installed";

const PAGE_SIZE = 24;

export function AppStoreCatalog({ initialApps }: AppStoreCatalogProps) {
  const [apps, setApps] = useState<AppSummary[]>(initialApps.slice(0, PAGE_SIZE));
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 350);
  const [category, setCategory] = useState<string | null>(null);
  const [view, setView] = useState<AppStoreView>("catalog");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialApps.length >= PAGE_SIZE);
  const [loadingApps, setLoadingApps] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalJobId, setTerminalJobId] = useState<string | null>(null);
  const [terminalTitle, setTerminalTitle] = useState("Running app operation");

  const [allCategories, setAllCategories] = useState<string[]>(() => extractCategories(initialApps));
  const [installedSource, setInstalledSource] = useState<AppSummary[]>([]);
  const filteredInstalledCount = useMemo(
    () => filterInstalledApps(installedSource, debouncedQuery, category).length,
    [installedSource, debouncedQuery, category],
  );

  useEffect(() => {
    setPage(1);
  }, [view, debouncedQuery, category]);

  const loadApps = useCallback(async () => {
    setLoadingApps(true);

    try {
      if (view === "catalog") {
        const response = await listApps({
          q: debouncedQuery || undefined,
          category: category || undefined,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });

        const pageItems = response.data || [];
        setApps(pageItems);
        setHasNextPage(pageItems.length === PAGE_SIZE);
        setAllCategories((previous) => mergeCategories(previous, pageItems));
        return;
      }

      const response = await listInstalledApps();
      const installedApps = response.data || [];
      const filteredInstalledApps = filterInstalledApps(installedApps, debouncedQuery, category);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      setInstalledSource(installedApps);
      setApps(filteredInstalledApps.slice(start, end));
      setHasNextPage(end < filteredInstalledApps.length);
      setAllCategories((previous) => mergeCategories(previous, installedApps));
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
  }, [view, debouncedQuery, category, page]);

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
                Categories
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {allCategories.length}
              </Text>
            </Box>
            <ThemeIcon variant="light" color="teal" radius="xl">
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
          </Group>

          <Group gap="xs">
            <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={loadApps} loading={loadingApps}>
              Refresh
            </Button>
            <Button leftSection={<IconBolt size={16} />} onClick={handleSync} loading={syncing}>
              Sync Catalog
            </Button>
          </Group>
        </Group>
      </Paper>

      <Box pos="relative">
        <LoadingOverlay visible={loadingApps} zIndex={10} overlayProps={{ radius: "sm", blur: 1 }} />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {apps.map((app) => (
            <UnstyledButton
              key={app.app_id}
              component={Link}
              href={`/app-store/${encodeURIComponent(app.app_id)}`}
              style={{ display: "block" }}
              aria-label={`Open details for ${app.title}`}
            >
              <Paper withBorder radius="md" p="sm" style={{ transition: "border-color 180ms ease" }}>
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
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {app.tagline || app.description || "No tagline available."}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </UnstyledButton>
          ))}
        </SimpleGrid>

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

function mergeCategories(current: string[], apps: AppSummary[]): string[] {
  const merged = new Set(current);
  for (const category of extractCategories(apps)) {
    merged.add(category);
  }
  return Array.from(merged).sort();
}

function filterInstalledApps(apps: AppSummary[], query: string, category: string | null): AppSummary[] {
  const normalizedQuery = query.trim().toLowerCase();

  return apps.filter((app) => {
    const matchesCategory = !category || app.category === category;
    if (!matchesCategory) return false;

    if (!normalizedQuery) return true;

    const haystack = [app.title, app.tagline, app.description, app.developer, app.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
