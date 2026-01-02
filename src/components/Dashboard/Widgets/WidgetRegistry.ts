import { NeoFetch } from '../NeoFetch';
import { StorageLocations } from '../StorageLocations';
import type { OSInfo, HWInfo, VersionInfo, FilesystemLocation } from '@/lib/client';

export type WidgetType = 'neofetch' | 'storage_locations';

export interface WidgetData {
  osInfo?: OSInfo;
  hwInfo?: HWInfo;
  version?: VersionInfo;
  locations?: FilesystemLocation[];
}

export const WidgetRegistry: Record<string, React.FC<any>> = {
  neofetch: NeoFetch,
  storage_locations: StorageLocations,
};

export const AvailableWidgets = [
  { 
    id: 'neofetch', 
    label: 'System Info (NeoFetch)', 
    defaultW: 1, 
    defaultH: 1,
    minW: 1,
    minH: 1
  },
  { 
    id: 'storage_locations', 
    label: 'Storage Locations', 
    defaultW: 1, 
    defaultH: 1,
    minW: 1,
    minH: 1
  },
];
