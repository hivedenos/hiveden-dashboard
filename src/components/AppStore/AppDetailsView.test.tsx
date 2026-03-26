import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { afterEach, expect, test, vi } from "vitest";
import type { AppDetail } from "@/lib/client";
import { AppDetailsView } from "./AppDetailsView";

const mockAdoptAppContainers = vi.fn();
const mockGetAppDetail = vi.fn();
const mockGetComposePreview = vi.fn();
const mockInstallApp = vi.fn();
const mockListContainersForAdoption = vi.fn();
const mockUnlinkAppContainer = vi.fn();
const mockUninstallApp = vi.fn();
const mockPush = vi.fn();

vi.mock("@/actions/app-store", () => ({
  adoptAppContainers: (...args: unknown[]) => mockAdoptAppContainers(...args),
  getAppDetail: (...args: unknown[]) => mockGetAppDetail(...args),
  getComposePreview: (...args: unknown[]) => mockGetComposePreview(...args),
  installApp: (...args: unknown[]) => mockInstallApp(...args),
  listContainersForAdoption: (...args: unknown[]) => mockListContainersForAdoption(...args),
  unlinkAppContainer: (...args: unknown[]) => mockUnlinkAppContainer(...args),
  uninstallApp: (...args: unknown[]) => mockUninstallApp(...args),
}));

vi.mock("@/components/Terminal/Terminal", () => ({
  Terminal: () => <div>Terminal</div>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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
    installed: false,
    installed_containers: [],
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

test("shows linked installed containers for installed apps", () => {
  const detail = createDetail({
    installed: true,
    channel: "stable",
    installable: true,
    install_block_reason: null,
    installed_containers: [
      {
        container_id: "container-123",
        container_name: "paperless-web",
        status: "running",
        image: "ghcr.io/example/paperless:latest",
        external: true,
        can_unlink: true,
      },
    ],
  });

  renderWithMantine(<AppDetailsView initialDetail={detail} />);

  expect(screen.getByText("Installed containers")).toBeDefined();
  expect(screen.getByRole("button", { name: "Open details" })).toBeDefined();
  expect(screen.getByText("running")).toBeDefined();
  expect(screen.getByText("Image: ghcr.io/example/paperless:latest")).toBeDefined();
  expect(screen.getByText("External")).toBeDefined();
  expect(screen.getByText("ID: container-123")).toBeDefined();
  expect(screen.getByText(/open a linked container/i)).toBeDefined();
  expect(screen.getByRole("button", { name: "Remove link" })).toBeDefined();
});

test("shows adopted badge for non-external linked containers", () => {
  const detail = createDetail({
    installed: true,
    channel: "stable",
    installable: true,
    install_block_reason: null,
    installed_containers: [
      {
        container_id: "container-456",
        container_name: "immich-server",
        status: "exited",
        external: false,
        can_unlink: false,
      },
    ],
  });

  renderWithMantine(<AppDetailsView initialDetail={detail} />);

  expect(screen.getByText("Adopted")).toBeDefined();
  expect((screen.getByRole("button", { name: "Remove link" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("Installed by this app and cannot be unlinked.")).toBeDefined();
});

test("unlinks removable adopted containers", async () => {
  const detail = createDetail({
    installed: true,
    channel: "stable",
    installable: true,
    install_block_reason: null,
    installed_containers: [
      {
        container_id: "container-789",
        container_name: "linkable-worker",
        can_unlink: true,
      },
    ],
  });

  mockUnlinkAppContainer.mockResolvedValue({ message: "Container unlinked" });
  mockGetAppDetail.mockResolvedValue({ data: detail });

  renderWithMantine(<AppDetailsView initialDetail={detail} />);

  fireEvent.click(screen.getByRole("button", { name: "Remove link" }));

  await waitFor(() => {
    expect(mockUnlinkAppContainer).toHaveBeenCalledWith("app-1", "container-789");
  });
  await waitFor(() => {
    expect(mockGetAppDetail).toHaveBeenCalledWith("app-1");
  });
});

test("links multiple containers to an app", async () => {
  const detail = createDetail({
    installed: false,
    channel: "stable",
    channel_label: "Stable",
    installable: true,
    install_block_reason: null,
  });

  mockListContainersForAdoption.mockResolvedValue({
    data: [
      { Id: "container-1", Name: "/app-web", State: "running" },
      { Id: "container-2", Name: "/app-worker", State: "running" },
    ],
  });
  mockAdoptAppContainers.mockResolvedValue({
    data: { containers: [{ container_id: "container-1" }, { container_id: "container-2" }] },
    message: "Containers linked",
  });
  mockGetAppDetail.mockResolvedValue({ data: detail });

  renderWithMantine(<AppDetailsView initialDetail={detail} />);

  fireEvent.click(screen.getByRole("button", { name: "Link existing container" }));

  const multiSelectInput = await screen.findByPlaceholderText("Select one or more containers");
  fireEvent.focus(multiSelectInput);
  fireEvent.click(await screen.findByText("app-web (container-1) · running"));
  fireEvent.focus(multiSelectInput);
  fireEvent.click(await screen.findByText("app-worker (container-2) · running"));
  fireEvent.click(screen.getByRole("button", { name: "Link containers" }));

  await waitFor(() => {
    expect(mockAdoptAppContainers).toHaveBeenCalledWith("app-1", {
      container_names_or_ids: ["container-1", "container-2"],
    });
  });
});

test("hides installed containers section when app is not installed", () => {
  const detail = createDetail({
    installed: false,
    installed_containers: [
      {
        container_id: "container-123",
        container_name: "paperless-web",
      },
    ],
  });

  renderWithMantine(<AppDetailsView initialDetail={detail} />);

  expect(screen.queryByText("Installed containers")).toBeNull();
});

test("hides installed containers section when no linked containers exist", () => {
  const detail = createDetail({
    installed: true,
    channel: "stable",
    installable: true,
    install_block_reason: null,
    installed_containers: [],
  });

  renderWithMantine(<AppDetailsView initialDetail={detail} />);

  expect(screen.queryByText("Installed containers")).toBeNull();
});
