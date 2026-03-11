import { cleanup, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, expect, test, vi } from "vitest";
import type { AppDetail } from "@/lib/client";
import { AppDetailsView } from "./AppDetailsView";

const mockAdoptAppContainers = vi.fn();
const mockGetAppDetail = vi.fn();
const mockGetComposePreview = vi.fn();
const mockInstallApp = vi.fn();
const mockListContainersForAdoption = vi.fn();
const mockUninstallApp = vi.fn();

vi.mock("@/actions/app-store", () => ({
  adoptAppContainers: (...args: unknown[]) => mockAdoptAppContainers(...args),
  getAppDetail: (...args: unknown[]) => mockGetAppDetail(...args),
  getComposePreview: (...args: unknown[]) => mockGetComposePreview(...args),
  installApp: (...args: unknown[]) => mockInstallApp(...args),
  listContainersForAdoption: (...args: unknown[]) => mockListContainersForAdoption(...args),
  uninstallApp: (...args: unknown[]) => mockUninstallApp(...args),
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

function createDetail(overrides: Partial<AppDetail> = {}): AppDetail {
  return {
    catalog_id: "catalog-1",
    app_id: "app-1",
    title: "App 1",
    description: "Description",
    tagline: "Tagline",
    channel: "incubator",
    channel_label: "Incubator",
    installable: false,
    install_block_reason: "Promotion required before install",
    image_urls: [],
    dependencies: [],
    dependencies_apps: [],
    dependencies_system_packages: [],
    ...overrides,
  };
}

test("shows promotion CTA for incubator apps", () => {
  renderWithMantine(<AppDetailsView initialDetail={createDetail()} />);

  expect(screen.getByRole("link", { name: "Request Promotion" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
  expect(screen.getByText(/cannot be installed or linked to existing containers/i)).toBeDefined();
});

test("builds a github promote-app issue link for incubator apps", () => {
  const detail = createDetail({
    origin_channel: "edge",
    repository_path: "apps/app-1",
    manifest_url: "https://example.com/manifest.json",
    compose_url: "https://example.com/docker-compose.yml",
  });
  renderWithMantine(<AppDetailsView initialDetail={detail} />);

  const promotionLink = screen.getByRole("link", { name: "Request Promotion" });
  const href = promotionLink.getAttribute("href");

  expect(href).toContain("https://github.com/hivedenos/hivedenos-apps/issues/new?");
  expect(href).toContain("template=promote-app.yaml");
  expect(href).toContain("title=Promote%3A+App+1");
  expect(href).toContain("labels=promote-app");
  expect(href).toContain("app-name=App+1");
  expect(href).toContain("incubator-channel=Incubator");
  expect(href).toContain("description=Description");
  expect(href).toContain("extra-info=");
  expect(href).toContain("Origin+Channel%3A+Edge");
  expect(href).toContain("Repository+Path%3A+apps%2Fapp-1");
});
