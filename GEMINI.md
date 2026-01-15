# Hiveden Dashboard - Project Context for Gemini

## Project Overview
**Hiveden Dashboard** is a comprehensive web-based management interface for a home server or NAS ecosystem. It allows users to manage Docker containers, LXC containers, storage (ZFS/Btrfs), systemd services, and file systems through a modern, responsive UI.

## Tech Stack

### Core Framework
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Runtime:** Node.js

### UI & Styling
- **Component Library:** [Mantine v7](https://mantine.dev/) (Core, Hooks, Notifications)
- **Charts:** @mantine/charts (Recharts wrapper)
- **Icons:** @tabler/icons-react
- **Terminal:** xterm.js (for web-based shell access)
- **Styling:** CSS Modules (`.module.css`) and Mantine style props.

### Backend Integration
- **API Client:** Auto-generated TypeScript client using `openapi-typescript-codegen`.
- **Backend URL:** Defaults to `http://localhost:8000` (FastAPI).
- **Client Location:** `src/lib/client` (**DO NOT EDIT MANUALLY**)

## Architecture & Conventions

### 1. Data Fetching & Mutations (Server Actions)
The project heavily relies on **Next.js Server Actions** to bridge the frontend and the external API.
- **Location:** `src/actions/`
- **Pattern:**
    ```typescript
    "use server";
    import { DockerService } from "@/lib/client";

    export async function listContainers() {
      return DockerService.listAllContainersDockerContainersGet();
    }
    ```
- **Usage:** Server actions are called directly from Client Components (e.g., in `useEffect`) or Server Components.

### 2. Project Structure
- `src/app/`: App Router pages and layouts.
    - `layout.tsx`: Root layout including `MantineProvider`.
    - `globals.css`: Global styles.
    - Feature directories: `docker/`, `storage/`, `system/`, etc.
- `src/components/`: Reusable UI components.
    - Organized by feature: `Docker/`, `Storage/`, `System/`, `Dashboard/`.
    - `Layout/`: App shell, navigation, sidebar.
- `src/lib/`: Utilities and API configuration.
    - `client/`: Generated API client code.
    - `api.ts`: Configures the OpenAPI client base URL.
    - `format.ts`: Helper functions (e.g., `formatBytes`).
- `src/hooks/`: Custom React hooks (e.g., `useContainerForm`).

### 3. API Client Generation
The API client is generated from the backend's OpenAPI spec (`openapi.json`).
- **Command:** `npm run generate-client`
- **Prerequisite:** The backend must be running at `http://localhost:8000`.

## Development Workflow

### Build & Run
- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev` (Runs on `localhost:3000`)
- **Production Build:** `npm run build`
- **Start Production:** `npm run start`

### Key Libraries usage
- **Mantine:** Use `<Stack>`, `<Group>`, `<Text>`, `<Button>`, `<Table>` for layout and basic elements. Use `notifications.show()` for alerts.
- **Docker Management:** The dashboard supports listing, creating (from form or Compose), starting, stopping, and deleting containers and images.
- **File Explorer:** Implements a full file manager interface using `ExplorerService`.

## Recent Updates (Memory)
- **Docker Images:** Added support for listing images, viewing layers, seeing connected containers, and deleting images.
    - Page: `/docker/images`
    - Components: `DockerImagesList`, `ImageLayersModal`, `DockerImageActions`.
- **Storage & Shares:**
    - Added RAID management page `/storage/raid/[id]`.
    - Added ability to add disks to RAID arrays with level migration.
    - Refactored Shares UI:
        - `/shares/smb`: Manage exported and mounted SMB shares.
        - `/shares/nfs`: Placeholder for NFS.
    - Added "Mount Remote Share" functionality in the SMB page.
