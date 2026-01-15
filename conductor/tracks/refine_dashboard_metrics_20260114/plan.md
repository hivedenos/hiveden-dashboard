# Implementation Plan: Refine Dashboard Metrics Widgets

## Phase 1: Foundation & Data Fetching
Goal: Set up the component structure and integrate with the `MetricsService`.

- [x] Task: Create directory structure for metrics widgets in `src/components/Dashboard/Widgets/metrics/` [94a2116]
- [x] Task: Create a base MetricCard wrapper component following Mantine/Material design. [0b67378]
- [ ] Task: Implement a custom hook `useSystemMetrics` for polling `MetricsService.getSystemMetricsMetricsGet`.
    - [ ] Write Tests: Create `src/hooks/useSystemMetrics.test.ts` to mock the service and verify polling/data mapping.
    - [ ] Implement Feature: Create `src/hooks/useSystemMetrics.ts`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Data Fetching' (Protocol in workflow.md)

## Phase 2: UI Implementation
Goal: Build the individual metric components for CPU, RAM, and Disk.

- [ ] Task: Implement `CPUMetric` component.
    - [ ] Write Tests: Create `src/components/Dashboard/Widgets/metrics/CPUMetric.test.tsx` to verify rendering with various load levels.
    - [ ] Implement Feature: Create `src/components/Dashboard/Widgets/metrics/CPUMetric.tsx` using `recharts` for a small sparkline.
- [ ] Task: Implement `MemoryMetric` component.
    - [ ] Write Tests: Create `src/components/Dashboard/Widgets/metrics/MemoryMetric.test.tsx`.
    - [ ] Implement Feature: Create `src/components/Dashboard/Widgets/metrics/MemoryMetric.tsx`.
- [ ] Task: Implement `DiskMetric` component.
    - [ ] Write Tests: Create `src/components/Dashboard/Widgets/metrics/DiskMetric.test.tsx`.
    - [ ] Implement Feature: Create `src/components/Dashboard/Widgets/metrics/DiskMetric.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UI Implementation' (Protocol in workflow.md)

## Phase 3: Integration & Polish
Goal: Assemble the grid on the landing page and refine the UX.

- [ ] Task: Create `SystemMetricsGrid.tsx` to arrange the widgets.
- [ ] Task: Integrate `SystemMetricsGrid` into `src/app/page.tsx`.
- [ ] Task: Add loading skeletons and error states to all widgets.
- [ ] Task: Final responsive design check and mobile interaction polish.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Integration & Polish' (Protocol in workflow.md)
