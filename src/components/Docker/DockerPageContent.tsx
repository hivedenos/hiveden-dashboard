'use client';

import { Container, Title, Group, Collapse, Button, Menu, ActionIcon, rem } from '@mantine/core';
import { DockerList } from './DockerList';
import { ContainerActions } from './ContainerActions';
import { useState } from 'react';
import type { Container as DockerContainer } from '@/lib/client';
import Link from 'next/link';
import { IconPlus, IconChevronDown, IconFileImport } from '@tabler/icons-react';

export function DockerPageContent({ containers }: { containers: DockerContainer[] }) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Get first selected container's state for bulk actions
  const firstSelectedContainer = containers.find(c => selectedRows.has(c.Id));
  const selectedContainerState = firstSelectedContainer?.State || '';

  return (
    <Container fluid>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Docker Containers</Title>
        <Group>
            <Collapse in={selectedRows.size > 0} transitionDuration={300} transitionTimingFunction="ease">
            <ContainerActions 
                containerId={Array.from(selectedRows).join(',')} 
                containerState={selectedContainerState}
                size="big"
            />
            </Collapse>
            <Group gap={0}>
              <Button 
                component={Link} 
                href="/docker/containers/new" 
                leftSection={<IconPlus size={16} />}
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              >
                  Add Container
              </Button>
              <Menu transitionProps={{ transition: 'pop' }} position="bottom-end" withinPortal>
                <Menu.Target>
                  <ActionIcon
                    variant="filled"
                    size={36}
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: '1px solid rgba(255, 255, 255, 0.2)' }}
                    aria-label="More options"
                  >
                    <IconChevronDown style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    href="/docker/containers/new/import-compose"
                    leftSection={<IconFileImport style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
                  >
                    Import from Docker Compose
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
        </Group>
      </Group>
      <DockerList 
        containers={containers} 
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
      />
    </Container>
  );
}
