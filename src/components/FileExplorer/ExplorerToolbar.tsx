'use client';

import { ActionIcon, Anchor, Box, Breadcrumbs, Checkbox, CloseButton, Collapse, Group, Menu, SegmentedControl, Stack, TextInput } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import {
  IconActivity,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconAdjustmentsHorizontal,
  IconFolderPlus,
  IconHome,
  IconMenu2,
  IconLayoutGrid,
  IconList,
  IconUpload,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import { SortBy, SortOrder } from '@/lib/client';

import { useExplorer } from './ExplorerProvider';
import { createUploadEntriesFromFiles } from './uploadEntries';

export function ExplorerToolbar({ onToggleOperations, onToggleSidebar }: { onToggleOperations: () => void; onToggleSidebar: () => void }) {
  const {
    currentPath,
    navigateBack,
    navigateForward,
    navigateUp,
    navigateTo,
    viewMode,
    setViewMode,
    historyIndex,
    history,
    toggleHidden,
    showHidden,
    setSort,
    sortBy,
    sortOrder,
    performSearch,
    clearSearch,
    isSearching,
    createFolder,
    uploadFiles,
    isUploading,
    searchOptions,
    setSearchOptions,
  } = useExplorer();

  const [pathInputMode, setPathInputMode] = useState(false);
  const [pathValue, setPathValue] = useState(currentPath);
  const [searchValue, setSearchValue] = useState('');
  const [searchDetailsOpen, setSearchDetailsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directoryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPathValue(currentPath);
  }, [currentPath]);

  useEffect(() => {
    if (!isSearching && searchValue !== '') {
      setSearchValue('');
    }
  }, [isSearching, searchValue]);

  useEffect(() => {
    if (!directoryInputRef.current) {
      return;
    }

    directoryInputRef.current.setAttribute('webkitdirectory', '');
    directoryInputRef.current.setAttribute('directory', '');
  }, []);

  const handlePathSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigateTo(pathValue);
    setPathInputMode(false);
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean).map((segment, index, array) => {
    const path = `/${array.slice(0, index + 1).join('/')}`;

    return (
      <Anchor key={path} size="sm" onClick={() => navigateTo(path)} underline="hover" c="dimmed">
        {segment}
      </Anchor>
    );
  });

  const handleSearch = useDebouncedCallback((query: string) => {
    if (query) {
      performSearch(query, searchOptions);
    } else {
      clearSearch();
    }
  }, 300);

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    handleSearch(value);
  };

  const updateSearchOption = (nextOptions: typeof searchOptions) => {
    setSearchOptions(nextOptions);

    if (searchValue.trim()) {
      performSearch(searchValue, nextOptions);
    }
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = createUploadEntriesFromFiles(Array.from(event.target.files ?? []));
    if (selectedFiles.length > 0) {
      await uploadFiles(selectedFiles);
    }

    event.target.value = '';
  };

  const handleDirectorySelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = createUploadEntriesFromFiles(Array.from(event.target.files ?? []));
    if (selectedFiles.length > 0) {
      await uploadFiles(selectedFiles);
    }

    event.target.value = '';
  };

  return (
    <Stack gap="xs" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }} bg="var(--mantine-color-body)">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Group gap={4}>
          <ActionIcon variant="subtle" onClick={navigateBack} disabled={historyIndex <= 0} aria-label="Go back">
            <IconArrowLeft size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            onClick={navigateForward}
            disabled={historyIndex >= history.length - 1}
            aria-label="Go forward"
          >
            <IconArrowRight size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" onClick={navigateUp} disabled={currentPath === '/'} aria-label="Go up one level">
            <IconArrowUp size={18} />
          </ActionIcon>
        </Group>

        <Group gap="xs" wrap="wrap">
          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={(value) => setViewMode(value as 'list' | 'grid')}
            data={[
              { value: 'list', label: <IconList size={14} /> },
              { value: 'grid', label: <IconLayoutGrid size={14} /> },
            ]}
            aria-label="Explorer view mode"
          />

          <ActionIcon variant="default" aria-label="Show operations" hiddenFrom="xl" onClick={onToggleOperations}>
            <IconActivity size={18} />
          </ActionIcon>

          <ActionIcon variant="default" aria-label="Create folder" onClick={createFolder}>
            <IconFolderPlus size={18} />
          </ActionIcon>

          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="default"
                aria-label="Upload files"
                loading={isUploading}
              >
                <IconUpload size={18} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconUpload size={16} />} onClick={() => fileInputRef.current?.click()}>
                Upload files
              </Menu.Item>
              <Menu.Item leftSection={<IconUpload size={16} />} onClick={() => directoryInputRef.current?.click()}>
                Upload folder
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="default" aria-label="Explorer settings">
                <IconSettings size={18} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>View Options</Menu.Label>
              <Menu.Item closeMenuOnClick={false}>
                <Checkbox label="Show hidden files" checked={showHidden} onChange={toggleHidden} />
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>Sort By</Menu.Label>
              <Menu.Item onClick={() => setSort(SortBy.NAME, sortOrder)} fw={sortBy === SortBy.NAME ? 600 : 400}>Name</Menu.Item>
              <Menu.Item onClick={() => setSort(SortBy.SIZE, sortOrder)} fw={sortBy === SortBy.SIZE ? 600 : 400}>Size</Menu.Item>
              <Menu.Item onClick={() => setSort(SortBy.MODIFIED, sortOrder)} fw={sortBy === SortBy.MODIFIED ? 600 : 400}>Date Modified</Menu.Item>
              <Menu.Item onClick={() => setSort(SortBy.TYPE, sortOrder)} fw={sortBy === SortBy.TYPE ? 600 : 400}>Type</Menu.Item>

              <Menu.Divider />

              <Menu.Label>Order</Menu.Label>
              <Menu.Item onClick={() => setSort(sortBy, SortOrder.ASC)} fw={sortOrder === SortOrder.ASC ? 600 : 400}>Ascending</Menu.Item>
              <Menu.Item onClick={() => setSort(sortBy, SortOrder.DESC)} fw={sortOrder === SortOrder.DESC ? 600 : 400}>Descending</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <input ref={fileInputRef} type="file" multiple hidden onChange={(event) => void handleFileSelection(event)} />
      <input ref={directoryInputRef} type="file" multiple hidden data-testid="directory-upload-input" onChange={(event) => void handleDirectorySelection(event)} />

      <Group align="stretch" wrap="wrap" gap="sm">
        <ActionIcon variant="default" aria-label="Open locations" hiddenFrom="md" onClick={onToggleSidebar}>
          <IconMenu2 size={18} />
        </ActionIcon>

        <Box style={{ flex: '2 1 22rem', minWidth: 0, cursor: 'text' }} onClick={() => !pathInputMode && setPathInputMode(true)}>
          {pathInputMode ? (
            <form onSubmit={handlePathSubmit}>
              <TextInput
                value={pathValue}
                onChange={(event) => setPathValue(event.target.value)}
                autoFocus
                onBlur={() => setPathInputMode(false)}
                rightSection={<IconSearch size={16} />}
                size="sm"
                aria-label="Current path"
              />
            </form>
          ) : (
            <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden', minHeight: 36 }}>
              <ActionIcon
                size="sm"
                variant="transparent"
                aria-label="Go to root"
                onClick={(event) => {
                  event.stopPropagation();
                  navigateTo('/');
                }}
              >
                <IconHome size={14} />
              </ActionIcon>
              <Breadcrumbs separator=">" style={{ flexWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {breadcrumbs}
              </Breadcrumbs>
            </Group>
          )}
        </Box>

        <TextInput
          placeholder="Search this location"
          leftSection={<IconSearch size={16} />}
          size="sm"
          style={{ flex: '1 1 16rem', minWidth: 220 }}
          value={searchValue}
          onChange={onSearchChange}
          aria-label="Search files"
          rightSection={
            searchValue ? (
              <CloseButton
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearchValue('');
                  clearSearch();
                }}
                aria-label="Clear search"
              />
            ) : null
          }
        />

        <ActionIcon
          variant={searchDetailsOpen ? 'filled' : 'default'}
          aria-label="Search options"
          onClick={() => setSearchDetailsOpen((opened) => !opened)}
        >
          <IconAdjustmentsHorizontal size={18} />
        </ActionIcon>
      </Group>

      <Collapse in={searchDetailsOpen}>
        <Group align="flex-end" wrap="wrap" gap="md">
          <Checkbox
            label="Regex"
            checked={Boolean(searchOptions.use_regex)}
            onChange={(event) => updateSearchOption({ ...searchOptions, use_regex: event.currentTarget.checked })}
          />
          <Checkbox
            label="Case sensitive"
            checked={Boolean(searchOptions.case_sensitive)}
            onChange={(event) => updateSearchOption({ ...searchOptions, case_sensitive: event.currentTarget.checked })}
          />
          <SegmentedControl
            size="xs"
            value={searchOptions.type_filter ?? 'all'}
            onChange={(value) => updateSearchOption({ ...searchOptions, type_filter: value })}
            data={[
              { label: 'All', value: 'all' },
              { label: 'Files', value: 'file' },
              { label: 'Folders', value: 'directory' },
            ]}
            aria-label="Search type filter"
          />
        </Group>
      </Collapse>
    </Stack>
  );
}
