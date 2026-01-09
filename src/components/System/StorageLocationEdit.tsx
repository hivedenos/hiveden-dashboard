'use client';

import { useState } from 'react';
import { 
  Paper, 
  Title, 
  Select, 
  TextInput, 
  Button, 
  Group, 
  LoadingOverlay, 
  Text,
  Alert,
  Checkbox
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { IconCheck, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { updateSystemLocation } from '@/actions/system';
import type { FilesystemLocation, BtrfsVolume } from '@/lib/client';
import Link from 'next/link';

interface StorageLocationEditProps {
  location: FilesystemLocation;
  volumes: BtrfsVolume[];
}

export function StorageLocationEdit({ location, volumes }: StorageLocationEditProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Check if current path matches any volume
  const initialIsCustom = !volumes.some(v => v.mountpoint === location.path);
  
  const [selection, setSelection] = useState<string | null>(initialIsCustom ? 'custom' : location.path);
  const [customPath, setCustomPath] = useState(initialIsCustom ? location.path : '');
  const [shouldMigrateData, setShouldMigrateData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const volumeOptions = volumes.map(v => ({ 
    value: v.mountpoint, 
    label: `${v.label || v.mountpoint} (${v.mountpoint})` 
  }));
  
  const options = [...volumeOptions, { value: 'custom', label: 'Custom Path' }];

  const customPathMode = selection === 'custom';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.key) return;
    
    if (!selection) {
      setError('Please select a location');
      return;
    }

    const path = selection === 'custom' ? customPath : selection;
    
    if (selection === 'custom' && (!path || path.trim().length === 0)) {
      setError('Path is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await updateSystemLocation(location.key, { 
        new_path: path,
        should_migrate_data: shouldMigrateData 
      });
      
      notifications.show({
        title: 'Success',
        message: `Location "${location.label}" updated successfully`,
        color: 'green',
        icon: <IconCheck size="1.1rem" />,
      });
      
      router.push('/system?tab=locations');
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update location',
        color: 'red',
        icon: <IconAlertCircle size="1.1rem" />,
      });
      setLoading(false);
    }
  };

  return (
    <Paper p="md" pos="relative">
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      
      <Group mb="lg">
        <Button component={Link} href="/system?tab=locations" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          Back
        </Button>
        <Title order={3}>Edit Location: {location.label}</Title>
      </Group>

      <Text mb="md" c="dimmed">{location.description}</Text>

      <form onSubmit={handleSubmit}>
        <Select
          label="Storage Path"
          description="Select a Btrfs volume or define a custom path"
          data={options}
          mb="md"
          value={selection}
          onChange={(val) => {
            setSelection(val);
            setError(null);
          }}
          error={error && !customPathMode ? error : null}
        />

        {customPathMode && (
          <TextInput
            label="Custom Path"
            description="Absolute path on the host system"
            placeholder="/mnt/..."
            mb="md"
            value={customPath}
            onChange={(e) => {
              setCustomPath(e.currentTarget.value);
              setError(null);
            }}
            error={error && customPathMode ? error : null}
          />
        )}

        <Checkbox
          label="Migrate existing data"
          description="Move current files to the new location"
          checked={shouldMigrateData}
          onChange={(e) => setShouldMigrateData(e.currentTarget.checked)}
          mb="xl"
        />

        <Group justify="flex-end" mt="xl">
          <Button component={Link} href="/system?tab=locations" variant="default">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
