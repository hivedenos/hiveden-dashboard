import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MantineProvider } from "@mantine/core";
import { DockerFleetMetricsRow } from "./DockerFleetMetricsRow";

vi.mock("@/hooks/useDockerFleetMetrics", () => ({
  useDockerFleetMetrics: vi.fn(),
}));

import * as dockerFleetMetricsModule from "@/hooks/useDockerFleetMetrics";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function renderWithMantine(ui: React.ReactNode) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

test("DockerFleetMetricsRow renders cards and network arrow icons", () => {
  vi.mocked(dockerFleetMetricsModule.useDockerFleetMetrics).mockReturnValue({
    data: {
      runningContainers: 8,
      cpuPercent: 27.3,
      memoryBytes: 123456789,
      networkRxBps: 1024,
      networkTxBps: 2048,
    },
    loading: false,
    error: null,
  });

  renderWithMantine(<DockerFleetMetricsRow />);

  expect(screen.getByText("Running Containers")).toBeDefined();
  expect(screen.getByText("Docker CPU")).toBeDefined();
  expect(screen.getByText("Docker RAM")).toBeDefined();
  expect(screen.getByText("Docker Network")).toBeDefined();
  expect(screen.getByLabelText("Docker download")).toBeDefined();
  expect(screen.getByLabelText("Docker upload")).toBeDefined();
});
