'use client';

import { ActionIcon, Group, Menu, NavLink, ScrollArea, Stack, Text } from '@mantine/core';
import { 
  IconDots,
  IconHome,
  IconCurrentLocation,
  IconPencil,
  IconTrash,
  IconStar 
} from '@tabler/icons-react';
import { useExplorer } from './ExplorerProvider';

export function ExplorerSidebar({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void } = {}) {
  const { navigateTo, currentPath, homePath, bookmarks, editBookmark, removeBookmark } = useExplorer();

  const handleNavigate = (path: string) => {
    navigateTo(path);
    onNavigate?.();
  };

  return (
    <Stack
      gap={0}
      h="100%"
      w={compact ? '100%' : 240}
      style={{ borderRight: compact ? undefined : '1px solid var(--mantine-color-default-border)' }}
      bg="var(--mantine-color-body)"
    >
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="md" p="md">
          
          {/* Quick Access */}
          <BoxSection title="Quick Access">
            <NavItem 
              icon={<IconHome size={16} />} 
              label="Root" 
              active={currentPath === '/'} 
              onClick={() => handleNavigate('/')}
            />
            <NavItem 
              icon={<IconCurrentLocation size={16} />} 
              label="Workspace" 
              active={currentPath === homePath} 
              onClick={() => handleNavigate(homePath)}
            />
          </BoxSection>

          <BoxSection title="Bookmarks">
            {bookmarks.length > 0 ? (
              bookmarks.map((bookmark) => (
                <Group key={bookmark.path} gap="xs" wrap="nowrap">
                  <NavItem
                    icon={<IconStar size={16} />}
                    label={bookmark.name}
                    active={currentPath === bookmark.path}
                    onClick={() => handleNavigate(bookmark.path)}
                    style={{ flex: 1 }}
                  />
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" aria-label={`Manage bookmark ${bookmark.name}`}>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => editBookmark(bookmark)}>
                        Rename
                      </Menu.Item>
                      <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => void removeBookmark(bookmark)}>
                        Remove
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
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

function NavItem({ icon, label, active, onClick, style }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, style?: React.CSSProperties }) {
    return (
        <NavLink
            label={label}
            leftSection={icon}
            active={active}
            onClick={onClick}
            variant="light"
            style={{ borderRadius: 'var(--mantine-radius-sm)', ...style }}
        />
    )
}
