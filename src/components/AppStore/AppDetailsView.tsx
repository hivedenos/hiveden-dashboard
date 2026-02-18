"use client";

import { adoptAppContainers, getAppDetail, getComposePreview, installApp, listContainersForAdoption, uninstallApp } from "@/actions/app-store";
import { Terminal } from "@/components/Terminal/Terminal";
import type { AppAdoptRequest, AppDetail, AppInstallRequest, AppUninstallRequest } from "@/lib/client";
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
  Image,
  LoadingOverlay,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconExternalLink,
  IconLink,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { getErrorMessage, parseEnvOverrides } from "./appStoreUiUtils";

interface AppDetailsViewProps {
  initialDetail: AppDetail;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function AppDetailsView({ initialDetail }: AppDetailsViewProps) {
  const [detail, setDetail] = useState<AppDetail>(initialDetail);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [refreshingDetail, setRefreshingDetail] = useState(false);
  const [activeAction, setActiveAction] = useState<"install" | "uninstall" | "adopt" | null>(null);

  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [autoInstallPrereqs, setAutoInstallPrereqs] = useState(true);
  const [envOverridesInput, setEnvOverridesInput] = useState("");

  const [uninstallModalOpen, setUninstallModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState(false);
  const [deleteDatabases, setDeleteDatabases] = useState(false);
  const [deleteDns, setDeleteDns] = useState(false);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [containerOptions, setContainerOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [containersLoading, setContainersLoading] = useState(false);
  const [containersError, setContainersError] = useState<string | null>(null);

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalJobId, setTerminalJobId] = useState<string | null>(null);
  const [terminalTitle, setTerminalTitle] = useState("Running app operation");

  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composePreview, setComposePreview] = useState<string | null>(null);
  const [composePreviewUrl, setComposePreviewUrl] = useState<string | null>(null);
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeTruncated, setComposeTruncated] = useState(false);

  const screenshots = useMemo(() => {
    const candidates = detail.image_urls?.filter((url): url is string => !!url) || [];
    if (candidates.length > 0) return candidates;
    if (detail.icon_url) return [detail.icon_url];
    if (detail.icon) return [detail.icon];
    return [];
  }, [detail]);

  useEffect(() => {
    if (activeImageIndex >= screenshots.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, screenshots.length]);

  const refreshDetail = useCallback(async () => {
    setRefreshingDetail(true);
    try {
      const response = await getAppDetail(detail.app_id);
      setDetail(response.data);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to refresh app details"),
        color: "red",
      });
    } finally {
      setRefreshingDetail(false);
    }
  }, [detail.app_id]);

  const nextImage = () => {
    if (screenshots.length <= 1) return;
    setActiveImageIndex((current) => (current + 1) % screenshots.length);
    setZoomLevel(MIN_ZOOM);
  };

  const previousImage = () => {
    if (screenshots.length <= 1) return;
    setActiveImageIndex((current) => (current - 1 + screenshots.length) % screenshots.length);
    setZoomLevel(MIN_ZOOM);
  };

  const openZoomModal = () => {
    if (screenshots.length === 0) return;
    setZoomModalOpen(true);
    setZoomLevel(MIN_ZOOM);
  };

  const closeZoomModal = () => {
    setZoomModalOpen(false);
    setZoomLevel(MIN_ZOOM);
  };

  const zoomIn = () => setZoomLevel((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
  const zoomOut = () => setZoomLevel((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
  const resetZoom = () => setZoomLevel(MIN_ZOOM);

  const onScreenshotKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openZoomModal();
    }
  };

  const openComposePreview = async () => {
    if (!detail.compose_url) return;

    setComposeModalOpen(true);

    if (composePreview && composePreviewUrl === detail.compose_url && !composeError) {
      return;
    }

    setComposeLoading(true);
    setComposeError(null);

    try {
      const response = await getComposePreview(detail.compose_url);
      setComposePreview(response.content);
      setComposePreviewUrl(detail.compose_url);
      setComposeTruncated(response.truncated);
    } catch (error) {
      setComposePreview(null);
      setComposeTruncated(false);
      setComposeError(getErrorMessage(error, "Failed to load compose preview"));
    } finally {
      setComposeLoading(false);
    }
  };

  const loadContainersForAdoption = useCallback(async () => {
    setContainersLoading(true);
    setContainersError(null);

    try {
      const response = await listContainersForAdoption();
      const options = response.data.map((container) => {
        const containerName = container.Name?.replace(/^\/+/, "") || container.Id.slice(0, 12);
        const state = container.State || "unknown";

        return {
          value: container.Id,
          label: `${containerName} (${container.Id.slice(0, 12)}) · ${state}`,
        };
      });

      setContainerOptions(options);
      setSelectedContainerId((current) => {
        if (!current) return null;
        return options.some((option) => option.value === current) ? current : null;
      });
    } catch (error) {
      setContainerOptions([]);
      setSelectedContainerId(null);
      setContainersError(getErrorMessage(error, "Failed to load containers"));
    } finally {
      setContainersLoading(false);
    }
  }, []);

  const openLinkContainerModal = async () => {
    setLinkModalOpen(true);
    setSelectedContainerId(null);
    await loadContainersForAdoption();
  };

  const handleAdopt = async () => {
    if (!selectedContainerId) {
      notifications.show({
        title: "Container required",
        message: "Select a container to link with this app.",
        color: "yellow",
      });
      return;
    }

    setActiveAction("adopt");
    try {
      const payload: AppAdoptRequest = {
        container_names_or_ids: [selectedContainerId],
      };

      const response = await adoptAppContainers(detail.app_id, payload);
      const adoptedCount = response.data?.containers?.length ?? 0;

      notifications.show({
        title: "Container linked",
        message:
          response.message ||
          (adoptedCount > 0
            ? `${detail.title} linked to ${adoptedCount} container${adoptedCount === 1 ? "" : "s"}.`
            : `${detail.title} was linked to the selected container.`),
        color: "green",
      });

      setLinkModalOpen(false);
      setSelectedContainerId(null);

      await refreshDetail();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to link existing container"),
        color: "red",
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleInstall = async () => {
    setActiveAction("install");
    try {
      const payload: AppInstallRequest = {
        auto_install_prereqs: autoInstallPrereqs,
        env_overrides: parseEnvOverrides(envOverridesInput),
      };

      const response = await installApp(detail.app_id, payload);
      const jobId = response.data?.job_id;

      notifications.show({
        title: "Installation started",
        message: response.message || `${detail.title} installation is in progress.`,
        color: "green",
      });

      setInstallModalOpen(false);
      setAutoInstallPrereqs(true);
      setEnvOverridesInput("");

      if (jobId) {
        setTerminalJobId(jobId);
        setTerminalTitle(`Installing ${detail.title}`);
        setTerminalOpen(true);
      }

      await refreshDetail();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to install app"),
        color: "red",
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleUninstall = async () => {
    setActiveAction("uninstall");
    try {
      const payload: AppUninstallRequest = {
        delete_data: deleteData,
        delete_databases: deleteDatabases,
        delete_dns: deleteDns,
      };

      const response = await uninstallApp(detail.app_id, payload);
      const jobId = response.data?.job_id;

      notifications.show({
        title: "Uninstall started",
        message: response.message || `${detail.title} removal is in progress.`,
        color: "orange",
      });

      setUninstallModalOpen(false);
      setDeleteData(false);
      setDeleteDatabases(false);
      setDeleteDns(false);

      if (jobId) {
        setTerminalJobId(jobId);
        setTerminalTitle(`Uninstalling ${detail.title}`);
        setTerminalOpen(true);
      }

      await refreshDetail();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: getErrorMessage(error, "Failed to uninstall app"),
        color: "red",
      });
    } finally {
      setActiveAction(null);
    }
  };

  const jobSocketFactory = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(`${wsUrl}/shell/ws/jobs/${terminalJobId}`);

    ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === "job_completed") {
          setTimeout(() => {
            refreshDetail();
          }, 700);
        }
      } catch {
        // ignore non-JSON payloads
      }
    });

    return ws;
  }, [terminalJobId, refreshDetail]);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Button component={Link} href="/app-store" variant="default" leftSection={<IconArrowLeft size={16} />}>
          Back to App Store
        </Button>
        <Group gap="sm">
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={refreshDetail}
            loading={refreshingDetail}
          >
            Refresh details
          </Button>
          {!detail.installed && (
            <Button
              size="md"
              variant="default"
              leftSection={<IconLink size={18} />}
              onClick={() => {
                void openLinkContainerModal();
              }}
              loading={activeAction === "adopt"}
            >
              Link existing container
            </Button>
          )}
          <Button
            size="md"
            color={detail.installed ? "red" : "blue"}
            leftSection={detail.installed ? <IconTrash size={18} /> : <IconDownload size={18} />}
            onClick={() => (detail.installed ? setUninstallModalOpen(true) : setInstallModalOpen(true))}
            loading={activeAction === (detail.installed ? "uninstall" : "install")}
          >
            {detail.installed ? "Uninstall" : "Install"}
          </Button>
        </Group>
      </Group>

      <Paper withBorder radius="lg" p="lg">
        <Box style={{ minWidth: 280 }}>
            <Group align="flex-start" gap="md" wrap="nowrap">
              <Avatar src={detail.icon_url || detail.icon || undefined} radius="md" color="blue" size={64}>
                {detail.title?.charAt(0)?.toUpperCase() || "A"}
              </Avatar>
              <Box>
                <Title order={2}>{detail.title}</Title>
                <Group gap={6} mt={8}>
                  {detail.version && (
                    <Badge variant="light" color="gray">
                      v{detail.version}
                    </Badge>
                  )}
                  {detail.category && (
                    <Badge variant="light" color="blue">
                      {detail.category}
                    </Badge>
                  )}
                </Group>
              </Box>
            </Group>

            <Text size="xs" c="dimmed" mt="md" fw={700} tt="uppercase">
              Tagline
            </Text>
            <Text size="lg" fw={600} mt={4}>
              {detail.tagline || "No tagline provided."}
            </Text>

            <Text size="xs" c="dimmed" mt="lg" fw={700} tt="uppercase">
              Description
            </Text>
            <Text size="sm" mt={4} style={{ lineHeight: 1.7 }}>
              {detail.description || "No description available."}
            </Text>

            {(detail.website || detail.repo || detail.support) && (
              <Group mt="md" gap="xs">
                {detail.website && (
                  <Button
                    component={Link}
                    href={detail.website}
                    target="_blank"
                    rel="noreferrer"
                    variant="default"
                    leftSection={<IconExternalLink size={16} />}
                  >
                    Website
                  </Button>
                )}
                {detail.repo && (
                  <Button
                    component={Link}
                    href={detail.repo}
                    target="_blank"
                    rel="noreferrer"
                    variant="default"
                    leftSection={<IconExternalLink size={16} />}
                  >
                    Repository
                  </Button>
                )}
                {detail.support && (
                  <Button
                    component={Link}
                    href={detail.support}
                    target="_blank"
                    rel="noreferrer"
                    variant="default"
                    leftSection={<IconExternalLink size={16} />}
                  >
                    Support
                  </Button>
                )}
              </Group>
            )}

            {detail.compose_url && (
              <Group mt="sm">
                <Button variant="default" onClick={openComposePreview}>
                  Preview compose file
                </Button>
              </Group>
            )}
        </Box>
      </Paper>

      <Paper withBorder radius="lg" p="lg">
        <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="sm">
          <Text fw={700}>Screenshots</Text>
          <Group gap="xs">
            <ActionIcon
              aria-label="Previous screenshot"
              size={44}
              variant="default"
              onClick={previousImage}
              disabled={screenshots.length <= 1}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <ActionIcon
              aria-label="Next screenshot"
              size={44}
              variant="default"
              onClick={nextImage}
              disabled={screenshots.length <= 1}
            >
              <IconChevronRight size={18} />
            </ActionIcon>
            <Button
              variant="default"
              leftSection={<IconSearch size={16} />}
              onClick={openZoomModal}
              disabled={screenshots.length === 0}
            >
              Zoom
            </Button>
          </Group>
        </Group>

        {screenshots.length > 0 ? (
          <Stack gap="sm">
            <Box
              role="button"
              tabIndex={0}
              aria-label="Open screenshot zoom view"
              onClick={openZoomModal}
              onKeyDown={onScreenshotKeyDown}
              style={{
                cursor: "zoom-in",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--mantine-color-gray-3)",
                background: "var(--mantine-color-gray-0)",
                height: "min(72vh, 620px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src={screenshots[activeImageIndex]}
                alt={`${detail.title} screenshot ${activeImageIndex + 1}`}
                h="100%"
                fit="contain"
                loading="lazy"
              />
            </Box>

            {screenshots.length > 1 && (
              <Group gap="xs" wrap="wrap">
                {screenshots.map((src, index) => (
                  <Box
                    key={`${src}-${index}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Go to screenshot ${index + 1}`}
                    onClick={() => setActiveImageIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveImageIndex(index);
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      borderRadius: 8,
                      overflow: "hidden",
                      border:
                        index === activeImageIndex
                          ? "2px solid var(--mantine-color-blue-6)"
                          : "1px solid var(--mantine-color-gray-3)",
                      width: 96,
                      height: 64,
                    }}
                  >
                    <Image
                      src={src}
                      alt={`${detail.title} thumbnail ${index + 1}`}
                      width={96}
                      height={64}
                      fit="cover"
                      loading="lazy"
                    />
                  </Box>
                ))}
              </Group>
            )}
          </Stack>
        ) : (
          <Alert color="gray" variant="light" title="No screenshots available">
            This app did not provide screenshots yet.
          </Alert>
        )}
      </Paper>

      {(detail.dependencies?.length || detail.dependencies_apps?.length || detail.dependencies_system_packages?.length) && (
        <Paper withBorder radius="lg" p="lg">
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="sm">
            Dependencies
          </Text>

          {detail.dependencies && detail.dependencies.length > 0 && (
            <Box mb="sm">
              <Text size="sm" fw={600} mb={6}>
                General
              </Text>
              <Group gap="xs">
                {detail.dependencies.map((dependency) => (
                  <Badge key={`general-${dependency}`} variant="light" color="gray">
                    {dependency}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          {detail.dependencies_apps && detail.dependencies_apps.length > 0 && (
            <Box mb="sm">
              <Text size="sm" fw={600} mb={6}>
                App Dependencies
              </Text>
              <Group gap="xs">
                {detail.dependencies_apps.map((dependency) => (
                  <Badge key={`app-${dependency}`} variant="light" color="orange">
                    {dependency}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          {detail.dependencies_system_packages && detail.dependencies_system_packages.length > 0 && (
            <Box>
              <Text size="sm" fw={600} mb={6}>
                System Package Dependencies
              </Text>
              <Group gap="xs">
                {detail.dependencies_system_packages.map((dependency) => (
                  <Badge key={`sys-${dependency}`} variant="light" color="grape">
                    {dependency}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}
        </Paper>
      )}

      <Modal
        opened={composeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        title={`Compose Preview - ${detail.title}`}
        size="xl"
        centered
      >
        <Stack gap="sm">
          {composeTruncated && (
            <Alert color="yellow" variant="light" title="Preview truncated">
              The compose file is large, so only part of it is shown.
            </Alert>
          )}

          {composeError && (
            <Alert color="red" variant="light" title="Unable to load compose preview">
              {composeError}
            </Alert>
          )}

          <Box pos="relative">
            <LoadingOverlay visible={composeLoading} zIndex={5} overlayProps={{ blur: 1, radius: "sm" }} />
            {!composeError && composePreview && (
              <ScrollArea h={520}>
                <Paper withBorder radius="sm" p="md">
                  <Text
                    component="pre"
                    ff="monospace"
                    size="sm"
                    style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}
                  >
                    {composePreview}
                  </Text>
                </Paper>
              </ScrollArea>
            )}
          </Box>
        </Stack>
      </Modal>

      <Modal opened={zoomModalOpen} onClose={closeZoomModal} title="Screenshot Zoom" size="95%" centered>
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group gap="xs">
              <ActionIcon
                aria-label="Previous screenshot in zoom view"
                size={44}
                variant="default"
                onClick={previousImage}
                disabled={screenshots.length <= 1}
              >
                <IconChevronLeft size={18} />
              </ActionIcon>
              <ActionIcon
                aria-label="Next screenshot in zoom view"
                size={44}
                variant="default"
                onClick={nextImage}
                disabled={screenshots.length <= 1}
              >
                <IconChevronRight size={18} />
              </ActionIcon>
            </Group>

            <Group gap="xs">
              <ActionIcon aria-label="Zoom out" size={44} variant="default" onClick={zoomOut} disabled={zoomLevel <= MIN_ZOOM}>
                <IconZoomOut size={18} />
              </ActionIcon>
              <ActionIcon aria-label="Zoom in" size={44} variant="default" onClick={zoomIn} disabled={zoomLevel >= MAX_ZOOM}>
                <IconZoomIn size={18} />
              </ActionIcon>
              <Button variant="default" onClick={resetZoom} disabled={zoomLevel === MIN_ZOOM}>
                Reset
              </Button>
            </Group>
          </Group>

          <Text size="sm" c="dimmed">
            Zoom: {(zoomLevel * 100).toFixed(0)}%
          </Text>

          <Box
            style={{
              border: "1px solid var(--mantine-color-gray-3)",
              borderRadius: 12,
              background: "var(--mantine-color-gray-0)",
              height: "min(78vh, 820px)",
              overflow: "auto",
            }}
          >
            {screenshots.length > 0 && (
              <Box
                style={{
                  minHeight: "100%",
                  minWidth: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <Image
                  src={screenshots[activeImageIndex]}
                  alt={`${detail.title} screenshot ${activeImageIndex + 1} zoomed`}
                  fit="contain"
                  loading="lazy"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: "transform 180ms ease",
                  }}
                />
              </Box>
            )}
          </Box>
        </Stack>
      </Modal>

      <Modal opened={installModalOpen} onClose={() => setInstallModalOpen(false)} title={`Install ${detail.title}`} centered>
        <Stack gap="md">
          <Checkbox
            checked={autoInstallPrereqs}
            onChange={(event) => setAutoInstallPrereqs(event.currentTarget.checked)}
            label="Automatically install prerequisites"
          />

          <Textarea
            label="Environment overrides"
            description="Optional. One key-value pair per line, format: KEY=value"
            placeholder="DOMAIN=example.local\nTZ=UTC"
            minRows={4}
            value={envOverridesInput}
            onChange={(event) => setEnvOverridesInput(event.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setInstallModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInstall} loading={activeAction === "install"}>
              Install
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title={`Link existing container to ${detail.title}`}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select an existing Docker container to adopt into this app.
          </Text>

          {containersError && (
            <Alert color="red" variant="light" title="Unable to load containers">
              {containersError}
            </Alert>
          )}

          <Select
            label="Container"
            placeholder={containersLoading ? "Loading containers..." : "Select a container"}
            data={containerOptions}
            value={selectedContainerId}
            onChange={setSelectedContainerId}
            searchable
            disabled={containersLoading}
            nothingFoundMessage="No containers found"
          />

          {!containersLoading && containerOptions.length === 0 && !containersError && (
            <Alert color="gray" variant="light" title="No containers available">
              No containers were found to link.
            </Alert>
          )}

          <Group justify="space-between">
            <Button
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                void loadContainersForAdoption();
              }}
              loading={containersLoading}
            >
              Refresh list
            </Button>

            <Group gap="xs">
              <Button variant="default" onClick={() => setLinkModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdopt} loading={activeAction === "adopt"} disabled={!selectedContainerId || containersLoading}>
                Link container
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={uninstallModalOpen} onClose={() => setUninstallModalOpen(false)} title={`Uninstall ${detail.title}`} centered>
        <Stack gap="md">
          <Alert color="orange" variant="light" title="Removal options">
            Choose additional resources to remove together with this app.
          </Alert>

          <Checkbox checked={deleteData} onChange={(event) => setDeleteData(event.currentTarget.checked)} label="Delete app data" />
          <Checkbox
            checked={deleteDatabases}
            onChange={(event) => setDeleteDatabases(event.currentTarget.checked)}
            label="Delete app databases"
          />
          <Checkbox checked={deleteDns} onChange={(event) => setDeleteDns(event.currentTarget.checked)} label="Delete DNS records" />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUninstallModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleUninstall} loading={activeAction === "uninstall"}>
              Uninstall
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
            <Terminal socketFactory={jobSocketFactory} mode="stream" onClose={() => setTerminalOpen(false)} title={terminalTitle} />
          </Box>
        )}
      </Modal>
    </Stack>
  );
}
