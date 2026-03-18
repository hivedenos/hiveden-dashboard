'use client';

import { Box, Card, Checkbox, Group, Loader, SimpleGrid, Stack, Table, Text, TextInput, ThemeIcon } from '@mantine/core';
import {
  IconArrowUp,
  IconFile,
  IconFileCode,
  IconFileText,
  IconFileZip,
  IconFolder,
  IconMusic,
  IconPhoto,
  IconVideo,
} from '@tabler/icons-react';
import { useMemo, useRef, useState } from 'react';

import { FileEntry } from '@/lib/client';

import { useExplorer } from './ExplorerProvider';
import { FileContextMenu } from './FileContextMenu';

export function FileList() {
  const {
    files,
    folders,
    selectedItems,
    toggleSelection,
    setSelection,
    selectAll,
    clearSelection,
    isLoading,
    openEntry,
    viewMode,
    error,
    submitRenameEntry,
  } = useExplorer();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: FileEntry; opened: boolean }>({
    x: 0,
    y: 0,
    opened: false,
  });

  const items = useMemo(() => [...folders, ...files], [files, folders]);
  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const indeterminate = selectedItems.size > 0 && selectedItems.size < items.length;
  const [anchorPath, setAnchorPath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const focusItem = (path: string) => {
    itemRefs.current.get(path)?.focus();
  };

  const selectRange = (fromPath: string, toPath: string, keepExisting = false) => {
    const startIndex = items.findIndex((item) => item.path === fromPath);
    const endIndex = items.findIndex((item) => item.path === toPath);

    if (startIndex < 0 || endIndex < 0) {
      return;
    }

    const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    const nextSelection = keepExisting ? new Set(selectedItems) : new Set<string>();

    items.slice(start, end + 1).forEach((item) => nextSelection.add(item.path));
    setSelection(Array.from(nextSelection));
  };

  const handleRowClick = (path: string, event: React.MouseEvent | React.KeyboardEvent) => {
    if (event.shiftKey && anchorPath) {
      selectRange(anchorPath, path, event.metaKey || event.ctrlKey);
      return;
    }

    const multi = event.metaKey || event.ctrlKey;

    if (multi) {
      toggleSelection(path, true);
      setAnchorPath(path);
      return;
    }

    setSelection([path]);
    setAnchorPath(path);
  };

  const handleItemKeyDown = (item: FileEntry, index: number, event: React.KeyboardEvent) => {
    if (event.key === 'F2') {
      event.preventDefault();
      setRenamingPath(item.path);
      setRenameValue(item.name);
      return;
    }

    if (event.key === 'Enter') {
      if (renamingPath === item.path) {
        return;
      }
      event.preventDefault();
      openEntry(item);
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      handleRowClick(item.path, event);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();

      const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= items.length) {
        return;
      }

      const nextItem = items[nextIndex];
      focusItem(nextItem.path);

      if (event.shiftKey) {
        selectRange(anchorPath ?? item.path, nextItem.path, false);
        return;
      }

      setSelection([nextItem.path]);
      setAnchorPath(nextItem.path);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();

      const targetItem = event.key === 'Home' ? items[0] : items[items.length - 1];

      if (!targetItem) {
        return;
      }

      focusItem(targetItem.path);
      if (event.shiftKey) {
        selectRange(anchorPath ?? item.path, targetItem.path, false);
      } else {
        setSelection([targetItem.path]);
        setAnchorPath(targetItem.path);
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent, item?: FileEntry) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      item,
      opened: true,
    });
  };

  const closeContextMenu = () => {
    setContextMenu((previous) => ({ ...previous, opened: false }));
  };

  const submitInlineRename = async (item: FileEntry) => {
    const nextName = renameValue.trim();

    if (!nextName || nextName === item.name) {
      setRenamingPath(null);
      setRenameValue('');
      return;
    }

    try {
      await submitRenameEntry(item, nextName);
      setRenamingPath(null);
      setRenameValue('');
    } catch {
      // Notifications are handled in provider.
    }
  };

  const cancelInlineRename = () => {
    setRenamingPath(null);
    setRenameValue('');
  };

  if (isLoading) {
    return (
      <Stack align="center" justify="center" p="xl" gap="sm">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">Loading files...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack align="center" justify="center" p="xl" gap="xs">
        <Text fw={600}>Could not load this location</Text>
        <Text size="sm" c="dimmed">{error}</Text>
      </Stack>
    );
  }

  if (items.length === 0) {
    return (
      <Box onContextMenu={(event) => handleContextMenu(event)} p="xl">
        <Stack align="center" justify="center" gap="xs" c="dimmed">
          <IconFolder size={48} />
          <Text fw={600}>This folder is empty</Text>
          <Text size="sm">Create a directory or paste files here.</Text>
        </Stack>
        <FileContextMenu
          opened={contextMenu.opened}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          targetItem={contextMenu.item}
        />
      </Box>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 1, xs: 2, md: 3, xl: 4 }} spacing="md" p="md" onContextMenu={(event) => handleContextMenu(event)}>
          {items.map((item) => {
            const isSelected = selectedItems.has(item.path);

            return (
              <Card
                key={item.path}
                ref={(node) => {
                  if (node) {
                    itemRefs.current.set(item.path, node);
                  } else {
                    itemRefs.current.delete(item.path);
                  }
                }}
                withBorder
                padding="md"
                radius="md"
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={(event) => handleRowClick(item.path, event)}
                onDoubleClick={() => openEntry(item)}
                onKeyDown={(event) => handleItemKeyDown(item, items.findIndex((candidate) => candidate.path === item.path), event)}
                onContextMenu={(event) => handleContextMenu(event, item)}
                style={{
                  cursor: 'default',
                  userSelect: 'none',
                  borderColor: isSelected ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-default-border)',
                  background: isSelected ? 'color-mix(in srgb, var(--mantine-color-blue-light) 78%, var(--mantine-color-body))' : 'var(--mantine-color-body)',
                  boxShadow: isSelected ? '0 0 0 1px var(--mantine-color-blue-outline)' : 'none',
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <FileIcon type={item.type} name={item.name} isSymlink={item.is_symlink} />
                    <Checkbox
                      aria-label={`Select ${item.name}`}
                      checked={isSelected}
                      onChange={() => {
                        toggleSelection(item.path, true);
                        setAnchorPath(item.path);
                      }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Group>
                  <Stack gap={4}>
                    {renamingPath === item.path ? (
                      <TextInput
                        value={renameValue}
                        size="xs"
                        autoFocus
                        onChange={(event) => setRenameValue(event.currentTarget.value)}
                        onClick={(event) => event.stopPropagation()}
                        onDoubleClick={(event) => event.stopPropagation()}
                        onBlur={() => void submitInlineRename(item)}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void submitInlineRename(item);
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            cancelInlineRename();
                          }
                        }}
                      />
                    ) : (
                      <Text fw={600} lineClamp={2}>{item.name}</Text>
                    )}
                    <Text size="sm" c="dimmed">{item.type === 'directory' ? 'Folder' : getExtension(item.name).toUpperCase()}</Text>
                    <Text size="sm" c="dimmed">{item.type === 'directory' ? '--' : formatSize(item.size)}</Text>
                    <Text size="xs" c="dimmed">{formatDate(item.modified)}</Text>
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      ) : (
        <Table highlightOnHover verticalSpacing="xs" onContextMenu={(event) => handleContextMenu(event)}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>
                <Checkbox
                  aria-label="Select all items"
                  checked={allSelected}
                  indeterminate={indeterminate}
                  onChange={allSelected ? clearSelection : selectAll}
                />
              </Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th ta="right">Size</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th ta="right">Modified</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => {
              const isSelected = selectedItems.has(item.path);
              const itemIndex = items.findIndex((candidate) => candidate.path === item.path);

              return (
                <Table.Tr
                  key={item.path}
                  ref={(node) => {
                    if (node) {
                      itemRefs.current.set(item.path, node);
                    } else {
                      itemRefs.current.delete(item.path);
                    }
                  }}
                  bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={(event) => handleRowClick(item.path, event)}
                  onDoubleClick={() => openEntry(item)}
                  onKeyDown={(event) => handleItemKeyDown(item, itemIndex, event)}
                  onContextMenu={(event) => handleContextMenu(event, item)}
                  style={{ cursor: 'default', userSelect: 'none', outlineOffset: -2 }}
                >
                  <Table.Td w={40}>
                    <Checkbox
                      aria-label={`Select ${item.name}`}
                      checked={isSelected}
                      onChange={() => {
                        toggleSelection(item.path, true);
                        setAnchorPath(item.path);
                      }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <FileIcon type={item.type} name={item.name} isSymlink={item.is_symlink} />
                      {renamingPath === item.path ? (
                        <TextInput
                          value={renameValue}
                          size="xs"
                          autoFocus
                          onChange={(event) => setRenameValue(event.currentTarget.value)}
                          onClick={(event) => event.stopPropagation()}
                          onDoubleClick={(event) => event.stopPropagation()}
                          onBlur={() => void submitInlineRename(item)}
                          onKeyDown={(event) => {
                            event.stopPropagation();
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void submitInlineRename(item);
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              cancelInlineRename();
                            }
                          }}
                        />
                      ) : (
                        <Text size="sm" truncate>{item.name}</Text>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" c="dimmed">{item.type === 'directory' ? '--' : formatSize(item.size)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" tt="uppercase">{item.type === 'directory' ? 'Folder' : getExtension(item.name)}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" c="dimmed">{formatDate(item.modified)}</Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <FileContextMenu
        opened={contextMenu.opened}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        targetItem={contextMenu.item}
      />
    </>
  );
}

const IconWrapper = ({ children, isSymlink }: { children: React.ReactNode; isSymlink?: boolean }) => (
  <Box style={{ position: 'relative', display: 'inline-block' }}>
    {children}
    {isSymlink ? (
      <Box
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          backgroundColor: 'var(--mantine-color-body)',
          borderRadius: '50%',
        }}
      >
        <IconArrowUp size={10} style={{ transform: 'rotate(45deg)', display: 'block' }} color="var(--mantine-color-text)" />
      </Box>
    ) : null}
  </Box>
);

function FileIcon({ type, name, isSymlink }: { type: 'file' | 'directory'; name: string; isSymlink?: boolean }) {
  if (type === 'directory') {
    return (
      <IconWrapper isSymlink={isSymlink}>
        <ThemeIcon variant="transparent" c="blue">
          <IconFolder />
        </ThemeIcon>
      </IconWrapper>
    );
  }

  const ext = name.split('.').pop()?.toLowerCase();
  let Icon = IconFile;
  let color = 'gray';

  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      Icon = IconPhoto;
      color = 'cyan';
      break;
    case 'mp3':
    case 'wav':
    case 'ogg':
      Icon = IconMusic;
      color = 'grape';
      break;
    case 'mp4':
    case 'mkv':
    case 'mov':
      Icon = IconVideo;
      color = 'pink';
      break;
    case 'txt':
    case 'md':
    case 'rtf':
      Icon = IconFileText;
      color = 'gray';
      break;
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
      Icon = IconFileZip;
      color = 'orange';
      break;
    case 'js':
    case 'ts':
    case 'tsx':
    case 'json':
    case 'html':
    case 'css':
      Icon = IconFileCode;
      color = 'yellow';
      break;
  }

  return (
    <IconWrapper isSymlink={isSymlink}>
      <ThemeIcon variant="transparent" c={color}>
        <Icon />
      </ThemeIcon>
    </IconWrapper>
  );
}

function formatSize(bytes?: number) {
  if (bytes === undefined) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getExtension(name: string) {
  return name.split('.').pop() || 'File';
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString();
}
