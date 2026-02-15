import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, test, vi } from "vitest";
import { ComposeYamlInput } from "./ComposeImport";

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

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ComposeYamlInput", () => {
  test("parses depends_on arrays and objects into dependencies", async () => {
    const onParsed = vi.fn();

    render(
      <MantineProvider>
        <ComposeYamlInput onParsed={onParsed} onCancel={vi.fn()} />
      </MantineProvider>
    );

    const yaml = `services:
  web:
    image: nginx:latest
    depends_on:
      - db
      - redis
  api:
    image: node:20
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
`;

    fireEvent.change(screen.getByLabelText("Docker Compose YAML"), {
      target: { value: yaml },
    });

    fireEvent.click(screen.getByRole("button", { name: /Validate & Continue/i }));

    await waitFor(() => {
      expect(onParsed).toHaveBeenCalledTimes(1);
    });

    const parsed = onParsed.mock.calls[0][0];
    expect(parsed[0].dependencies).toEqual(["db", "redis"]);
    expect(parsed[1].dependencies).toEqual(["db", "cache"]);
  });
});
