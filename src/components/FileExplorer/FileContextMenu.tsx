'use client';

import { Menu, rem } from '@mantine/core';
import { 
  IconFolderOpen, 
  IconScissors, 
  IconCopy, 
  IconClipboard, 
  IconPencil, 
  IconTrash, 
  IconDownload, 
  IconInfoCircle, 
  IconStar,
} from '@tabler/icons-react';
import { useExplorer } from './ExplorerProvider';
import { FileEntry } from '@/lib/client';

interface FileContextMenuProps {
  opened: boolean;
  x: number;
  y: number;
  onClose: () => void;
  targetItem?: FileEntry; // The item directly clicked on, if any
}

export function FileContextMenu({ opened, x, y, onClose, targetItem }: FileContextMenuProps) {
  const { 
    selectedItems, 
    files, 
    folders,
    clipboardStatus,
    openEntry,
    copySelection,
    cutSelection,
    pasteIntoCurrentPath,
    renameEntryByPath,
    deleteSelection,
    showPropertiesForPath,
    addBookmarkForEntry,
  } = useExplorer();

  // Determine what the context is
  // If targetItem is provided, we prioritize that. 
  // If targetItem is NOT in selectedItems, we treat it as a single selection of targetItem.
  // If targetItem IS in selectedItems, we treat it as an action on the selection group.
  
  // Logic to determine active selection for the menu
  let activeSelection: string[] = [];
  if (targetItem) {
      if (selectedItems.has(targetItem.path)) {
          activeSelection = Array.from(selectedItems);
      } else {
          activeSelection = [targetItem.path];
      }
  } else {
      activeSelection = Array.from(selectedItems);
  }

  const isMultiSelect = activeSelection.length > 1;
  const singleItemPath = activeSelection.length === 1 ? activeSelection[0] : null;
  
  // Find full entry object(s)
  const allEntries = [...folders, ...files];
  const activeEntries = allEntries.filter(e => activeSelection.includes(e.path));
  const singleEntry = activeEntries.length === 1 ? activeEntries[0] : null;

  if (!opened) return null;

  return (
    <Menu 
      opened={opened} 
      onClose={onClose} 
      position="bottom-start" 
      offset={0}
      withinPortal
    >
      <Menu.Dropdown style={{ position: 'fixed', top: y, left: x, zIndex: 9999 }}>
        <Menu.Label>
            {isMultiSelect ? `${activeSelection.length} items selected` : (singleEntry?.name || singleItemPath || 'Current Folder')}
        </Menu.Label>
        
        {singleEntry && (
            <Menu.Item 
                leftSection={<IconFolderOpen style={{ width: rem(14), height: rem(14) }} />}
                onClick={() => {
                    openEntry(singleEntry);
                    onClose();
                }}
            >
                Open
            </Menu.Item>
        )}

        <Menu.Divider />

        <Menu.Item
          leftSection={<IconScissors style={{ width: rem(14), height: rem(14) }} />}
          onClick={async () => {
            await cutSelection(activeSelection);
            onClose();
          }}
        >
          Cut
        </Menu.Item>
        <Menu.Item
          leftSection={<IconCopy style={{ width: rem(14), height: rem(14) }} />}
          onClick={async () => {
            await copySelection(activeSelection);
            onClose();
          }}
        >
          Copy
        </Menu.Item>
        <Menu.Item
          leftSection={<IconClipboard style={{ width: rem(14), height: rem(14) }} />}
          disabled={!clipboardStatus?.has_items}
          onClick={async () => {
            await pasteIntoCurrentPath();
            onClose();
          }}
        >
          Paste
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item 
            leftSection={<IconPencil style={{ width: rem(14), height: rem(14) }} />}
            disabled={isMultiSelect}
            onClick={async () => {
                if (!singleEntry) {
                    return;
                }
                await renameEntryByPath(singleEntry);
                onClose();
            }}
        >
          Rename
        </Menu.Item>
        <Menu.Item 
            color="red" 
            leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
            onClick={async () => {
                await deleteSelection(activeSelection);
                onClose();
            }}
        >
          Delete
        </Menu.Item>

        <Menu.Divider />

        {singleEntry && singleEntry.type === 'file' && (
             <Menu.Item
                leftSection={<IconDownload style={{ width: rem(14), height: rem(14) }} />}
                onClick={() => {
                    openEntry(singleEntry);
                    onClose();
                }}
             >
                Download
            </Menu.Item>
        )}

        <Menu.Item
          leftSection={<IconInfoCircle style={{ width: rem(14), height: rem(14) }} />}
          disabled={!singleEntry}
          onClick={async () => {
            if (!singleEntry) {
              return;
            }
            await showPropertiesForPath(singleEntry.path);
            onClose();
          }}
        >
          Properties
        </Menu.Item>
        
        {singleEntry && singleEntry.type === 'directory' && (
            <Menu.Item
              leftSection={<IconStar style={{ width: rem(14), height: rem(14) }} />}
              onClick={async () => {
                await addBookmarkForEntry(singleEntry);
                onClose();
              }}
            >
                Add to Bookmarks
            </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
