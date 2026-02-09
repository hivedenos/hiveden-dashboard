import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, test, vi } from "vitest";
import { ContainerResourceCards } from "./ContainerResourceCards";

vi.mock("@/hooks/useContainerMetrics", () => ({
  useContainerMetrics: vi.fn(),
}));

import { useContainerMetrics } from "@/hooks/useContainerMetrics";

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

describe("ContainerResourceCards", () => {
  test("renders null metrics safely with clear fallback text", () => {
    vi.mocked(useContainerMetrics).mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    render(
      <MantineProvider>
        <ContainerResourceCards containerName="app" containerState="running" />
      </MantineProvider>
    );

    expect(screen.getByText("CPU Usage")).toBeDefined();
    expect(screen.getByText("RAM Usage")).toBeDefined();
    expect(screen.getByText("Network")).toBeDefined();
    expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No metrics yet").length).toBeGreaterThan(0);
  });
});
