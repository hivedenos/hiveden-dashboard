# Specification: Refine Dashboard Metrics Widgets

## Goal
Enhance the Hiveden Dashboard landing page by implementing real-time, visually appealing metrics widgets for CPU, RAM, and Disk usage. These widgets will leverage the existing `MetricsService` and follow the project's design guidelines for high information density and immediate feedback.

## Requirements
- **Real-time Data:** Fetch system metrics (CPU, RAM, Disk) at regular intervals (e.g., every 5-10 seconds).
- **Visualization:** Use `recharts` to display historical trends (mini sparklines) and current usage (gauges or progress bars).
- **Responsive Design:** Widgets must be responsive and fit within the `DashboardLayout` grid.
- **Error Handling:** Gracefully handle API errors or data unavailability with loading states and error messages.
- **Integration:** Use the auto-generated `MetricsService` from `@/lib/client`.

## Design Guidelines
- **Material Design:** Clean cards with proper spacing and shadows.
- **Information Density:** Show current percentage, absolute values (e.g., "4.2 / 16 GB"), and a small trend line.
- **Immediate Feedback:** Use Mantine's loading skeletons while data is being fetched.
- **Dark-First:** Ensure colors used for charts (Green for healthy, Yellow for warning, Red for critical) are optimized for the dark theme.

## Technical Details
- **Location:** `src/components/Dashboard/Widgets/metrics/`
- **Component:** `SystemMetricsGrid.tsx` (containing individual `CPUMetric`, `MemoryMetric`, and `DiskMetric` components).
- **State Management:** Use React hooks (`useState`, `useEffect`) for polling and data storage.
- **Service:** `MetricsService.getSystemMetricsMetricsGet()`.
