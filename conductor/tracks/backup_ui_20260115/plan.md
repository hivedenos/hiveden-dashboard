# Implementation Plan: Backup Configuration UI

## Phase 1: Foundation & Navigation
Goal: Establish the routing, navigation, and basic page structures.

- [x] Task: Create directory structure for backups in `src/app/backups/`. [4f24001]
- [ ] Task: Add "Backups" link to the main navigation sidebar.
    - [ ] Write Tests: Verify the link exists and points to `/backups`.
    - [ ] Implement Feature: Update `src/components/Layout/Shell.tsx` (or equivalent) to include the navigation item.
- [ ] Task: Implement basic page skeletons for the Backups List and Create/Edit forms.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Navigation' (Protocol in workflow.md)

## Phase 2: Backups List & Data Fetching
Goal: Display existing backups with all required metadata.

- [ ] Task: Create a `BackupList` component using Mantine `Table`.
    - [ ] Write Tests: Mock API responses and verify the table renders columns for Status, Size, Type, and Actions.
    - [ ] Implement Feature: Create `src/components/Backups/BackupList.tsx` and integrate with the backup service.
- [ ] Task: Implement Status indicators (Badges) and data formatting (Bytes/Date).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backups List & Data Fetching' (Protocol in workflow.md)

## Phase 3: Backup Creation & Form Logic
Goal: Implement the creation flow with Cron builder and validation.

- [ ] Task: Develop a `CronHelper` component or utility for building/validating cron strings.
    - [ ] Write Tests: Verify regex validation and common schedule presets.
    - [ ] Implement Feature: Create `src/components/Backups/CronHelper.tsx`.
- [ ] Task: Build the `BackupForm` component.
    - [ ] Write Tests: Ensure "Database" vs "Application" selection and Crontab validation work as expected.
    - [ ] Implement Feature: Create `src/components/Backups/BackupForm.tsx`.
- [ ] Task: Implement the "Create" logic (Submit to API).
    - [ ] Logic: Ensure existing backups are replaced/handled according to the spec.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Backup Creation & Form Logic' (Protocol in workflow.md)

## Phase 4: Editing & Actions
Goal: Enable editing of schedules and immediate execution.

- [ ] Task: Implement "Edit" functionality in `BackupForm`.
    - [ ] Logic: Restrict editing to only the crontab field.
- [ ] Task: Implement "Run Now" action.
    - [ ] Implement Feature: Add action button to the list and form.
- [ ] Task: Implement "Delete" configuration action.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Editing & Actions' (Protocol in workflow.md)