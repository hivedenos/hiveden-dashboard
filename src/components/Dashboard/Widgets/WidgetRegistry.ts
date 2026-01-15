import type { FilesystemLocation, HWInfo, OSInfo, VersionInfo } from "@/lib/client";
import { NeoFetch } from "../NeoFetch";
import { StorageLocations } from "../StorageLocations";
import { SystemMetricsGrid } from "./metrics/SystemMetricsGrid";
import { RingWidget } from "./metrics/RingWidget";
import { SparklineWidget } from "./metrics/SparklineWidget";
import { StatWidget } from "./metrics/StatWidget";

export type WidgetType = "neofetch" | "storage_locations" | "system_metrics" | "ring_widget" | "sparkline_widget" | "stat_widget";

export interface WidgetData {
  osInfo?: OSInfo;
  hwInfo?: HWInfo;
  version?: VersionInfo;
  locations?: FilesystemLocation[];
}

export const WidgetRegistry: Record<string, React.FC<any>> = {
  neofetch: NeoFetch,
  storage_locations: StorageLocations,
  system_metrics: SystemMetricsGrid,
  ring_widget: RingWidget,
  sparkline_widget: SparklineWidget,
  stat_widget: StatWidget,
};

export const AvailableWidgets = [
  {
    id: "neofetch",
    label: "System Info (NeoFetch)",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "neofetch",
  },
  {
    id: "storage_locations",
    label: "Storage Locations",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "storage_locations",
  },
  {
    id: "system_metrics",
    label: "System Metrics (CPU/RAM/Disk)",
    defaultW: 2,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "system_metrics",
  },
  // Generic Metric Widgets
  {
    id: "metric_ring",
    label: "Metric (Ring)",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "ring_widget",
    props: {
      title: "New Metric",
      description: "Description",
      query: "up", // Default query
      unit: "",
      color: "blue",
    },
  },
  {
    id: "metric_sparkline",
    label: "Metric (Sparkline)",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "sparkline_widget",
    props: {
      title: "New Metric",
      description: "History",
      query: "up",
      unit: "",
      color: "grape",
    },
  },
  {
    id: "metric_stat",
    label: "Metric (Stat)",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "stat_widget",
    props: {
      title: "New Metric",
      description: "Live Value",
      query: "up",
      unit: "",
      color: "cyan",
    },
  },
  // Presets (Pre-configured)
  {
    id: "cpu_ring",
    label: "Host CPU (Ring)",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "ring_widget",
    props: {
      title: "Host CPU",
      description: "Total Load",
      query: 'rate(container_cpu_usage_seconds_total{name=~".*/.*"}[1m]) * 100', // Root cgroup
      containerName: "jellyfin",
      unit: "%",
      color: "teal",
    },
  },
  {
    id: "ram_sparkline",
    label: "Host RAM (Sparkline)",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "sparkline_widget",
    props: {
      title: "Host RAM",
      description: "Memory Usage",
      query: 'container_memory_usage_bytes{name=~".*/.*"}',
      containerName: "jellyfin",
      unit: "B",
      color: "violet",
    },
  },
  {
    id: "disk_stat",
    label: "Host Disk (Stat)",
    defaultW: 1,
    defaultH: 1,
    minW: 1,
    minH: 1,
    type: "stat_widget",
    props: {
      title: "Host Disk",
      description: "Total Usage",
      query: 'sum(container_fs_usage_bytes{name=~".*/.*"})',
      containerName: "jellyfin",
      unit: "B",
      color: "indigo",
    },
  },
];
