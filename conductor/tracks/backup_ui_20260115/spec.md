# Specification: Backup Configuration UI

## Overview
Implement a comprehensive "Backups" management interface within the Hiveden Dashboard. This feature allows users to schedule, monitor, and manage backups for both the system database and application directories. The UI will integrate with existing client models and provide a user-friendly way to handle crontab-based scheduling.

## Functional Requirements
### 1. Navigation
- Add a new "Backups" entry to the main sidebar/navigation menu.

### 2. Backups List Page
- Display a table/list of existing backup configurations and history.
- **Data Columns:** 
  - Type (Database vs. Application)
  - Creation Time
  - Status (Success, Failed, In Progress)
  - File Size
  - Location/Destination
  - Duration
  - Actions (Edit, Delete, Run Now)

### 3. Create Backup Page
- A dedicated form for setting up new backups.
- **Fields:**
  - **Backup Type:** Selection between "Database" and "Application Directory".
  - **Scheduling:** Crontab string input.
- **UI Helpers:**
  - Regex validation for crontab syntax.
  - Visual "Cron Builder" for non-technical users.
  - "Run Now" toggle/button for immediate execution.
  - Pre-defined common schedules (e.g., Daily, Weekly).
- **Logic:** Prevent duplicate backup configurations; if a backup for a target already exists, the old one must be replaced (handled via the update/delete-and-create pattern).

### 4. Edit Backup
- Users can modify the **crontab** of an existing backup configuration.
- Other fields (type/source) are read-only during editing.

## Technical Details
- **Tech Stack:** Next.js (App Router), Mantine v8, TypeScript.
- **API Integration:** Use the pre-existing backup models and services in the auto-generated client.
- **State Management:** Use Mantine forms for validation and server actions for mutations.

## Acceptance Criteria
- [ ] Users can navigate to the /backups page.
- [ ] List displays all relevant metadata (size, status, duration).
- [ ] Crontab input includes validation and helper tools.
- [ ] Successfully creating a backup replaces any existing configuration for that type/source.
- [ ] Editing only allows changing the schedule.
- [ ] "Run Now" triggers an immediate backup task.

## Out of Scope
- Backend logic for file deletion or backup execution (handled by the existing API).
- Cloud storage integration (limited to the locations supported by the current backend).