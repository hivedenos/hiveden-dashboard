import { MantineProvider } from "@mantine/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Terminal } from "./Terminal";

type OnDataHandler = (data: string) => void;

class MockXTerm {
  static instance: MockXTerm | null = null;
  cols = 120;
  rows = 30;
  onDataHandler: OnDataHandler | null = null;
  writes: string[] = [];
  clears = 0;

  constructor(options: unknown) {
    void options;
    MockXTerm.instance = this;
  }

  loadAddon() {}
  open() {}
  focus() {}
  fit() {}

  write(text: string) {
    this.writes.push(text);
  }

  writeln(text = "") {
    this.writes.push(`${text}\n`);
  }

  onData(handler: OnDataHandler) {
    this.onDataHandler = handler;
    return { dispose: vi.fn() };
  }

  clear() {
    this.clears += 1;
  }

  dispose() {}
}

class MockFitAddon {
  fit = vi.fn();
}

class MockWebLinksAddon {}

vi.mock("xterm", () => ({
  Terminal: MockXTerm,
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: MockFitAddon,
}));

vi.mock("@xterm/addon-web-links", () => ({
  WebLinksAddon: MockWebLinksAddon,
}));

vi.mock("@/lib/shellClient", () => ({
  connectToSession: vi.fn(),
}));

class MockSocket {
  readyState = WebSocket.OPEN;
  sent: string[] = [];
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  send(payload: string) {
    this.sent.push(payload);
  }

  close = vi.fn();
}

describe("Terminal", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    MockXTerm.instance = null;
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
  });

  test("interactive mode forwards raw keystrokes as input payloads", async () => {
    const socket = new MockSocket();

    render(
      <MantineProvider>
        <Terminal title="Shell Test" mode="interactive" socketFactory={() => socket as unknown as WebSocket} />
      </MantineProvider>,
    );

    await waitFor(() => expect(MockXTerm.instance).not.toBeNull());

    MockXTerm.instance?.onDataHandler?.("ls -la\r");

    expect(socket.sent.some((payload) => {
      const parsed = JSON.parse(payload);
      return parsed.type === "input" && parsed.data === "ls -la\r";
    })).toBe(true);
  });

  test("stream mode does not register interactive input handler", async () => {
    const socket = new MockSocket();

    render(
      <MantineProvider>
        <Terminal title="Stream Test" mode="stream" socketFactory={() => socket as unknown as WebSocket} />
      </MantineProvider>,
    );

    await waitFor(() => expect(MockXTerm.instance).not.toBeNull());
    expect(MockXTerm.instance?.onDataHandler).toBeNull();
  });

  test("clear action clears the terminal buffer", async () => {
    const socket = new MockSocket();

    render(
      <MantineProvider>
        <Terminal title="Clear Test" mode="interactive" socketFactory={() => socket as unknown as WebSocket} />
      </MantineProvider>,
    );

    await waitFor(() => expect(MockXTerm.instance).not.toBeNull());

    const clearButton = screen.getByRole("button", { name: "Clear terminal" });
    fireEvent.click(clearButton);

    expect(MockXTerm.instance?.clears).toBe(1);
  });
});
