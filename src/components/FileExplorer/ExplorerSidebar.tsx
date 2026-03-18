'use client';

import { Stack, NavLink, Text, Group, ScrollArea } from '@mantine/core';
import { 
  IconHome, 
  IconCurrentLocation,
  IconStar 
} from '@tabler/icons-react';
import { useExplorer } from './ExplorerProvider';

export function ExplorerSidebar() {
  const { navigateTo, currentPath, homePath, bookmarks } = useExplorer();

  return (
    <Stack gap={0} h="100%" w={240} style={{ borderRight: '1px solid var(--mantine-color-default-border)' }} bg="var(--mantine-color-body)">
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="md" p="md">
          
          {/* Quick Access */}
          <BoxSection title="Quick Access">
            <NavItem 
              icon={<IconHome size={16} />} 
              label="Root" 
              active={currentPath === '/'} 
              onClick={() => navigateTo('/')}
            />
            <NavItem 
              icon={<IconCurrentLocation size={16} />} 
              label="Workspace" 
              active={currentPath === homePath} 
              onClick={() => navigateTo(homePath)}
            />
          </BoxSection>

          <BoxSection title="Bookmarks">
            {bookmarks.length > 0 ? (
              bookmarks.map((bookmark) => (
                <NavItem
                  key={bookmark.path}
                  icon={<IconStar size={16} />}
                  label={bookmark.name}
                  active={currentPath === bookmark.path}
                  onClick={() => navigateTo(bookmark.path)}
                />
              ))
            ) : (
              <Text size="xs" c="dimmed" fs="italic">Add a bookmark from the context menu</Text>
            )}
          </BoxSection>

        </Stack>
      </ScrollArea>
    </Stack>
  );
}

function BoxSection({ title, children, rightSection }: { title: string, children: React.ReactNode, rightSection?: React.ReactNode }) {
    return (
        <Stack gap="xs">
            <Group justify="space-between">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>{title}</Text>
                {rightSection}
            </Group>
            <Stack gap={2}>
                {children}
            </Stack>
        </Stack>
    )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <NavLink
            label={label}
            leftSection={icon}
            active={active}
            onClick={onClick}
            variant="light"
            style={{ borderRadius: 'var(--mantine-radius-sm)' }}
        />
    )
}
