'use client';

import type { IngressContainerInfo } from '@/lib/client';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { IconApps, IconExternalLink, IconRefresh, IconWorld, IconX } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import classes from './ApplicationsGrid.module.css';

interface ApplicationsGridProps {
  applications: IngressContainerInfo[];
}

interface ApplicationCardProps {
  app: IngressContainerInfo;
  onOpen: (app: IngressContainerInfo) => void;
}

const EMBED_WARNING_TIMEOUT_MS = 6000;

function toFaviconUrl(url: string): string {
  try {
    return new URL('/favicon.ico', url).toString();
  } catch {
    return `${url.replace(/\/+$/, '')}/favicon.ico`;
  }
}

function ApplicationCard({ app, onOpen }: ApplicationCardProps) {
  const faviconUrl = toFaviconUrl(app.url);
  const iconSize = 44;

  return (
    <Tooltip label={app.name} withArrow position="top" openDelay={150}>
      <UnstyledButton
        type="button"
        onClick={() => onOpen(app)}
        aria-label={`Open ${app.name}`}
        className={classes.cardLink}
      >
        <Stack
          justify="center"
          align="center"
          gap={0}
          h="100%"
          p={4}
          className={classes.card}
        >
          <Box
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: 'var(--mantine-radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--mantine-color-default-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--mantine-color-body)',
            }}
          >
            <img
              src={faviconUrl}
              alt={`${app.name} logo`}
              width={iconSize}
              height={iconSize}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
                const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <ThemeIcon
              variant="light"
              color="gray"
              radius="sm"
              style={{ display: 'none', width: iconSize, height: iconSize }}
              aria-hidden
            >
              <IconWorld size={18} />
            </ThemeIcon>
          </Box>
        </Stack>
      </UnstyledButton>
    </Tooltip>
  );
}

export function ApplicationsGrid({ applications }: ApplicationsGridProps) {
  const [openedApp, setOpenedApp] = useState<IngressContainerInfo | null>(null);
  const [iframeVersion, setIframeVersion] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [showEmbedWarning, setShowEmbedWarning] = useState(false);

  const uniqueById = new Map<string, IngressContainerInfo>();
  applications.forEach((app) => {
    if (!uniqueById.has(app.id)) {
      uniqueById.set(app.id, app);
    }
  });

  const uniqueApplications = Array.from(uniqueById.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  const currentFaviconUrl = useMemo(() => {
    if (!openedApp) return '';
    return toFaviconUrl(openedApp.url);
  }, [openedApp]);

  useEffect(() => {
    if (!openedApp || !iframeLoading) {
      setShowEmbedWarning(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowEmbedWarning(true);
    }, EMBED_WARNING_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [openedApp, iframeLoading, iframeVersion]);

  const openAppInModal = (app: IngressContainerInfo) => {
    setOpenedApp(app);
    setIframeVersion(0);
    setIframeLoading(true);
    setShowEmbedWarning(false);
  };

  const closeModal = () => {
    setOpenedApp(null);
    setIframeLoading(false);
    setShowEmbedWarning(false);
  };

  const refreshIframe = () => {
    setIframeLoading(true);
    setShowEmbedWarning(false);
    setIframeVersion((prev) => prev + 1);
  };

  const openInNewTab = () => {
    if (!openedApp) return;
    window.open(openedApp.url, '_blank', 'noopener,noreferrer');
  };

  if (uniqueApplications.length === 0) {
    return (
      <Alert color="blue" title="No applications available" icon={<IconApps size={16} />}>
        No Traefik-exposed applications were found.
      </Alert>
    );
  }

  return (
    <>
      <SimpleGrid cols={{ base: 4, sm: 6, md: 8, lg: 10, xl: 12 }} spacing={6}>
        {uniqueApplications.map((app) => (
          <ApplicationCard key={app.id} app={app} onOpen={openAppInModal} />
        ))}
      </SimpleGrid>

      <Modal
        opened={Boolean(openedApp)}
        onClose={closeModal}
        fullScreen
        keepMounted
        radius={0}
        padding={0}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape
      >
        {openedApp && (
          <Stack h="100dvh" gap={0}>
            <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <Group gap="xs" wrap="nowrap">
                <Box
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 'var(--mantine-radius-xs)',
                    overflow: 'hidden',
                    border: '1px solid var(--mantine-color-default-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--mantine-color-body)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={currentFaviconUrl}
                    alt={`${openedApp.name} logo`}
                    width={24}
                    height={24}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                      const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <ThemeIcon
                    variant="light"
                    color="gray"
                    radius="xs"
                    style={{ display: 'none', width: 24, height: 24 }}
                    aria-hidden
                  >
                    <IconWorld size={14} />
                  </ThemeIcon>
                </Box>
                <Stack gap={0}>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {openedApp.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {openedApp.url}
                  </Text>
                </Stack>
              </Group>

              <Group gap="xs" wrap="nowrap">
                <ActionIcon variant="default" size="md" onClick={refreshIframe} aria-label="Refresh application">
                  <IconRefresh size={16} />
                </ActionIcon>
                <Button size="xs" variant="default" leftSection={<IconExternalLink size={14} />} onClick={openInNewTab}>
                  Open in new tab
                </Button>
                <ActionIcon variant="default" size="md" onClick={closeModal} aria-label="Close application modal">
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Group>

            <Box style={{ position: 'relative', flex: 1 }}>
              <LoadingOverlay visible={iframeLoading && !showEmbedWarning} zIndex={10} overlayProps={{ blur: 2 }} />

              {showEmbedWarning && (
                <Alert
                  color="yellow"
                  title="Unable to embed this application"
                  style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20 }}
                >
                  This app may block iframe embedding or may be unreachable. You can open it in a new tab.
                </Alert>
              )}

              <iframe
                key={`${openedApp.id}-${iframeVersion}`}
                src={openedApp.url}
                title={openedApp.name}
                onLoad={() => {
                  setIframeLoading(false);
                  setShowEmbedWarning(false);
                }}
                allow="clipboard-read; clipboard-write; fullscreen"
                style={{ width: '100%', height: '100%', border: 0 }}
              />
            </Box>
          </Stack>
        )}
      </Modal>
    </>
  );
}
