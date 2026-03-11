import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, expect, test, vi } from "vitest";
import type { AppSummary } from "@/lib/client";
import { AppStoreCatalog } from "./AppStoreCatalog";

const mockListApps = vi.fn();
const mockListInstalledApps = vi.fn();
const mockSyncAppCatalog = vi.fn();
const mockClearCatalogCache = vi.fn();

vi.mock("@/actions/app-store", () => ({
  listApps: (...args: unknown[]) => mockListApps(...args),
  listInstalledApps: (...args: unknown[]) => mockListInstalledApps(...args),
  syncAppCatalog: (...args: unknown[]) => mockSyncAppCatalog(...args),
  clearCatalogCache: (...args: unknown[]) => mockClearCatalogCache(...args),
}));

vi.mock("@/components/Terminal/Terminal", () => ({
  Terminal: () => <div>Terminal</div>,
}));

vi.mock("@/lib/shellClient", () => ({
  getWebSocketUrl: () => "ws://localhost:8000",
}));

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderWithMantine(ui: React.ReactNode) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

function createApp(index: number, installed = false): AppSummary {
  return {
    catalog_id: `catalog-${index}`,
    app_id: `app-${index}`,
    title: `App ${index}`,
    category: index % 2 === 0 ? "Utility" : "Media",
    channel: index % 2 === 0 ? "stable" : "incubator",
    channel_label: index % 2 === 0 ? "Stable" : "Incubator",
    installed,
    description: `Description ${index}`,
    installable: index % 2 === 0,
    install_block_reason: index % 2 === 0 ? null : "Promotion required before install",
  };
}

test("supports pagination for catalog results", async () => {
  const firstPage = Array.from({ length: 24 }, (_, index) => createApp(index + 1));
  const secondPage = [createApp(25)];

  mockListApps.mockImplementation(async (params?: { offset?: number }) => {
    if ((params?.offset || 0) >= 24) {
      return { data: secondPage };
    }
    return { data: firstPage };
  });
  mockListInstalledApps.mockResolvedValue({ data: [] });
  mockSyncAppCatalog.mockResolvedValue({ data: { job_id: "" } });
  mockClearCatalogCache.mockResolvedValue({ data: { cleared_entries: 0, job_id: "" } });

  renderWithMantine(<AppStoreCatalog initialApps={[]} />);

  await waitFor(() => {
    expect(mockListApps).toHaveBeenCalled();
  });
  expect(screen.getByText("App 1")).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  await waitFor(() => {
    expect(mockListApps).toHaveBeenCalledWith(expect.objectContaining({ offset: 24, limit: 24 }));
  });
  expect(screen.getByText("App 25")).toBeDefined();
});

test("loads installed view using installed endpoint", async () => {
  mockListApps.mockResolvedValue({ data: [createApp(1)] });
  mockListInstalledApps.mockResolvedValue({ data: [createApp(2, true), createApp(3, true)] });
  mockSyncAppCatalog.mockResolvedValue({ data: { job_id: "" } });
  mockClearCatalogCache.mockResolvedValue({ data: { cleared_entries: 0, job_id: "" } });

  renderWithMantine(<AppStoreCatalog initialApps={[]} />);

  await waitFor(() => {
    expect(mockListApps).toHaveBeenCalled();
  });

  fireEvent.click(screen.getByRole("radio", { name: "Installed" }));

  await waitFor(() => {
    expect(mockListInstalledApps).toHaveBeenCalled();
  });

  expect(screen.getByText("App 2")).toBeDefined();
  expect(screen.getByText("App 3")).toBeDefined();
});

test("renders clickable cards that navigate to details", async () => {
  const app = createApp(7, true);

  mockListApps.mockResolvedValue({ data: [app] });
  mockListInstalledApps.mockResolvedValue({ data: [] });
  mockSyncAppCatalog.mockResolvedValue({ data: { job_id: "" } });
  mockClearCatalogCache.mockResolvedValue({ data: { cleared_entries: 0, job_id: "" } });

  renderWithMantine(<AppStoreCatalog initialApps={[app]} />);

  await waitFor(() => {
    expect(mockListApps).toHaveBeenCalled();
  });

  const link = screen.getByRole("link", { name: "Open details for App 7" });
  expect(within(link).getByText("Installed")).toBeDefined();
  expect(link.getAttribute("href")).toBe("/app-store/app-7");
});

test("renders channel and installability metadata on cards", async () => {
  mockListApps.mockResolvedValue({ data: [createApp(1)] });
  mockListInstalledApps.mockResolvedValue({ data: [] });
  mockSyncAppCatalog.mockResolvedValue({ data: { job_id: "" } });
  mockClearCatalogCache.mockResolvedValue({ data: { cleared_entries: 0, job_id: "" } });

  renderWithMantine(<AppStoreCatalog initialApps={[createApp(1)]} />);

  await waitFor(() => {
    expect(mockListApps).toHaveBeenCalled();
  });

  expect(screen.getAllByText("Incubator").length).toBeGreaterThan(0);
  expect(screen.getByText("Promotion required before install")).toBeDefined();
  const promoteLink = screen.getByRole("link", { name: "Promote App 1 via GitHub" });
  expect(promoteLink.getAttribute("href")).toContain("template=promote-app.yaml");
  expect(promoteLink.getAttribute("href")).toContain("app-name=App+1");
});

test("renders clear cache maintenance action", async () => {
  mockListApps.mockResolvedValue({ data: [createApp(1)] });
  mockListInstalledApps.mockResolvedValue({ data: [] });
  mockSyncAppCatalog.mockResolvedValue({ data: { job_id: "" } });
  mockClearCatalogCache.mockResolvedValue({ data: { cleared_entries: 12, job_id: "" } });

  renderWithMantine(<AppStoreCatalog initialApps={[createApp(1)]} />);

  await waitFor(() => {
    expect(mockListApps).toHaveBeenCalled();
  });

  expect(screen.getByRole("button", { name: "Clear Cache" })).toBeDefined();
});
