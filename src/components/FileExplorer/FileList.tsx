'use client';

import { Table, Checkbox, Group, Text, ThemeIcon, Menu, ActionIcon } from '@mantine/core';
import { 
  IconFolder, 
  IconFile, 
  IconFileText, 
  IconPhoto, 
  IconMusic, 
  IconVideo, 
  IconFileZip, 
  IconFileCode,
  IconDotsVertical,
  IconArrowUp
} from '@tabler/icons-react';
import { useExplorer } from './ExplorerProvider';
import { FileEntry } from '@/lib/client';
import { useState } from 'react';
import { FileContextMenu } from './FileContextMenu';

export function FileList() {
  const { 
    files, 
    folders, 
    selectedItems, 
    toggleSelection, 
    selectAll, 
    clearSelection, 
    isLoading,
    navigateTo,
    currentPath
  } = useExplorer();

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item?: FileEntry, opened: boolean }>({
      x: 0,
      y: 0,
      opened: false
  });

  // Combine folders and files, folders first
  const items = [...folders, ...files];
  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const indeterminate = selectedItems.size > 0 && selectedItems.size < items.length;

  const handleRowClick = (name: string, e: React.MouseEvent) => {
    // Standard file manager behavior: 
    // Click: Select (exclusive unless ctrl/shift)
    // Ctrl+Click: Toggle selection
    // Here implementing simplified toggle for now
    if (e.ctrlKey || e.metaKey) {
        toggleSelection(name, true);
    } else {
        clearSelection();
        toggleSelection(name, false);
    }
  };

  const handleDoubleClick = (item: FileEntry) => {
    if (item.type === 'directory') {
        const path = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
        navigateTo(path);
    } else {
        // Handle file open/download
        console.log('Open file:', item.name);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item?: FileEntry) => {
      e.preventDefault();
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          item: item,
          opened: true
      });
  };

  const closeContextMenu = () => {
      setContextMenu(prev => ({ ...prev, opened: false }));
  };

  const rows = items.map((item) => {
    const isSelected = selectedItems.has(item.name);
    return (
      <Table.Tr 
        key={item.name} 
        bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
        onClick={(e) => handleRowClick(item.name, e)}
        onDoubleClick={() => handleDoubleClick(item)}
        onContextMenu={(e) => handleContextMenu(e, item)}
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        <Table.Td w={40}>
          <Checkbox 
            checked={isSelected} 
            onChange={() => toggleSelection(item.name, true)} 
            onClick={(e) => e.stopPropagation()}
          />
        </Table.Td>
        <Table.Td>
            <Group gap="xs">
                <FileIcon type={item.type} name={item.name} isSymlink={item.is_symlink} />
                <Text size="sm" truncate>{item.name}</Text>
            </Group>
        </Table.Td>
        <Table.Td ta="right">
            <Text size="sm" c="dimmed">
                {item.type === 'directory' ? '--' : formatSize(item.size)}
            </Text>
        </Table.Td>
        <Table.Td>
            <Text size="sm" c="dimmed" tt="uppercase">
                {item.type === 'directory' ? 'Folder' : getExtension(item.name)}
            </Text>
        </Table.Td>
        <Table.Td ta="right">
            <Text size="sm" c="dimmed">
                {formatDate(item.modified)}
            </Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  if (isLoading) {
      return <Text p="md">Loading...</Text>; // Replace with proper loader later
  }

  if (items.length === 0) {
      return (
          <div onContextMenu={(e) => handleContextMenu(e)}>
            <Group justify="center" p="xl" c="dimmed">
                <IconFolder size={48} />
                <Text>This folder is empty</Text>
            </Group>
            <FileContextMenu 
                opened={contextMenu.opened} 
                x={contextMenu.x} 
                y={contextMenu.y} 
                onClose={closeContextMenu} 
                targetItem={contextMenu.item}
            />
          </div>
      );
  }

  return (
    <>
        <Table highlightOnHover verticalSpacing="xs" onContextMenu={(e) => handleContextMenu(e)}>
        <Table.Thead>
            <Table.Tr>
            <Table.Th w={40}>
                <Checkbox 
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
        <Table.Tbody>{rows}</Table.Tbody>
        </Table>
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

// Helpers
const IconWrapper = ({ children, isSymlink }: { children: React.ReactNode, isSymlink?: boolean }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
        {children}
        {isSymlink && (
            <div style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: 'var(--mantine-color-body)', borderRadius: '50%' }}>
                 <IconArrowUp size={10} style={{ transform: 'rotate(45deg)', display: 'block' }} color="var(--mantine-color-text)" />
            </div>
        )}
    </div>
);

function FileIcon({ type, name, isSymlink }: { type: 'file' | 'directory', name: string, isSymlink?: boolean }) {

    if (type === 'directory') {
        return (
            <IconWrapper>
                <ThemeIcon variant="transparent" c="blue"><IconFolder /></ThemeIcon>
            </IconWrapper>
        );
    }
    
    const ext = name.split('.').pop()?.toLowerCase();
    let Icon = IconFile;
    let color = 'gray';

    switch (ext) {
        case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg':
            Icon = IconPhoto; color = 'cyan'; break;
        case 'mp3': case 'wav': case 'ogg':
            Icon = IconMusic; color = 'grape'; break;
        case 'mp4': case 'mkv': case 'mov':
            Icon = IconVideo; color = 'pink'; break;
        case 'txt': case 'md': case 'rtf':
            Icon = IconFileText; color = 'gray'; break;
        case 'zip': case 'tar': case 'gz': case '7z':
            Icon = IconFileZip; color = 'orange'; break;
        case 'js': case 'ts': case 'tsx': case 'json': case 'html': case 'css':
            Icon = IconFileCode; color = 'yellow'; break;
    }

    return (
        <IconWrapper>
            <ThemeIcon variant="transparent" c={color}><Icon /></ThemeIcon>
        </IconWrapper>
    );
}

function formatSize(bytes?: number) {
    if (bytes === undefined) return '--';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getExtension(name: string) {
    return name.split('.').pop() || 'File';
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString();
}
