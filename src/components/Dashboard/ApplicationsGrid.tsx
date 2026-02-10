'use client';

import type { IngressContainerInfo } from '@/lib/client';
import { Alert, Anchor, Box, SimpleGrid, Stack, ThemeIcon, Tooltip } from '@mantine/core';
import { IconApps, IconWorld } from '@tabler/icons-react';
import classes from './ApplicationsGrid.module.css';

interface ApplicationsGridProps {
  applications: IngressContainerInfo[];
}

interface ApplicationCardProps {
  app: IngressContainerInfo;
}

function toFaviconUrl(url: string): string {
  try {
    return new URL('/favicon.ico', url).toString();
  } catch {
    return `${url.replace(/\/+$/, '')}/favicon.ico`;
  }
}

function ApplicationCard({ app }: ApplicationCardProps) {
  const faviconUrl = toFaviconUrl(app.url);
  const iconSize = 44;

  return (
    <Tooltip label={app.name} withArrow position="top" openDelay={150}>
      <Anchor
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        underline="never"
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
      </Anchor>
    </Tooltip>
  );
}

export function ApplicationsGrid({ applications }: ApplicationsGridProps) {
  const uniqueById = new Map<string, IngressContainerInfo>();
  applications.forEach((app) => {
    if (!uniqueById.has(app.id)) {
      uniqueById.set(app.id, app);
    }
  });

  const uniqueApplications = Array.from(uniqueById.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  if (uniqueApplications.length === 0) {
    return (
      <Alert color="blue" title="No applications available" icon={<IconApps size={16} />}>
        No Traefik-exposed applications were found.
      </Alert>
    );
  }

  return (
    <SimpleGrid cols={{ base: 4, sm: 6, md: 8, lg: 10, xl: 12 }} spacing={6}>
      {uniqueApplications.map((app) => (
        <ApplicationCard key={app.id} app={app} />
      ))}
    </SimpleGrid>
  );
}
