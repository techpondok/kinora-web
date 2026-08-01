# Requirements Document

## Introduction

Family Suspension Management enables founders/superadmins to manage family suspension statuses from the Kinora Web Admin dashboard. The feature provides graduated suspension levels (Restricted, Full Suspension, Emergency-Only), reactivation workflows, a dedicated suspended families page, and full audit logging. This feature is admin-only and does not appear in the mobile user app.

## Glossary

- **Admin_Dashboard**: The Vue 3 web admin interface at /dashboard used by founders to manage Kinora families
- **Founder**: A superadmin user validated via `is_founder(auth.uid())` with full platform management access
- **Family**: A group entity in the `families` table representing a household unit with members, devices, and subscriptions
- **Suspension_Level**: The degree of access restriction applied to a family (Restricted, Full_Suspension, Emergency_Only)
- **Restricted**: Suspension level that blocks new members, new safe zones, purchases, role changes, and device pairing while allowing viewing of existing data
- **Full_Suspension**: Suspension level that blocks dashboard access, new chat, finance, tasks, non-emergency location, and device commands while allowing help/appeal pages
- **Emergency_Only**: Suspension level that permits only SOS, emergency contacts, location during SOS, and support access
- **Family_Status**: The operational status of a family (Active, Under_Review, Restricted, Suspended, Archived)
- **Suspension_RPC**: A SECURITY DEFINER PostgreSQL RPC that performs suspension operations with JWT validation, role checking, transaction handling, audit logging, notification dispatch, and idempotency
- **Audit_Log**: A record in the `audit_logs` table capturing admin actions with actor, action type, target, metadata, and timestamp
- **Reactivation**: The process of restoring a suspended family to active status with optional subscription restoration and service re-enablement

## Requirements

### Requirement 1: Family List Status Display

**User Story:** As a founder, I want to see family suspension statuses at a glance in the family list, so that I can quickly identify families requiring attention.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a status badge for each family showing one of: Active, Under_Review, Restricted, Suspended, or Archived
2. WHEN a founder selects a status filter, THE Admin_Dashboard SHALL display only families matching the selected Family_Status
3. THE Admin_Dashboard SHALL display the family owner name, member count, subscription plan, device count, and creation date for each family in the list
4. WHEN the family list loads, THE Admin_Dashboard SHALL sort families by most recently updated first

### Requirement 2: Suspend Family Form

**User Story:** As a founder, I want to suspend a family with specific parameters, so that I can enforce graduated restrictions appropriate to the situation.

#### Acceptance Criteria

1. WHEN a founder selects "Suspend" from the family actions menu, THE Admin_Dashboard SHALL display a modal containing a family summary, Suspension_Level selector, reason field, admin notes field, user-facing message field, start date, end date, auto-reactivate toggle, appeal permission toggle, subscription policy selector, and blocking options
2. THE Admin_Dashboard SHALL require the founder to select exactly one Suspension_Level (Restricted, Full_Suspension, or Emergency_Only) before submission
3. THE Admin_Dashboard SHALL require the founder to provide a reason before submission
4. WHEN the founder submits the suspend form with valid data, THE Suspension_RPC SHALL apply the selected Suspension_Level to the target family within a database transaction
5. WHEN the founder enables auto-reactivate and provides an end date, THE Suspension_RPC SHALL schedule automatic reactivation at the specified end date
6. IF the suspend form submission fails, THEN THE Admin_Dashboard SHALL display the error message and retain all form field values

### Requirement 3: Suspension Level Enforcement

**User Story:** As a founder, I want graduated suspension levels to apply specific access restrictions, so that families receive proportional enforcement.

#### Acceptance Criteria

1. WHILE a family has Restricted Suspension_Level, THE System SHALL block new member additions, new safe zone creation, purchases, role changes, and device pairing for that family
2. WHILE a family has Restricted Suspension_Level, THE System SHALL allow family members to view existing data
3. WHILE a family has Full_Suspension Suspension_Level, THE System SHALL block dashboard access, new chat creation, finance features, task management, non-emergency location tracking, and device commands for that family
4. WHILE a family has Full_Suspension Suspension_Level, THE System SHALL allow family members to access help pages and appeal pages
5. WHILE a family has Emergency_Only Suspension_Level, THE System SHALL allow only SOS activation, emergency contact access, location sharing during active SOS, and support access for that family
6. WHILE a family has Emergency_Only Suspension_Level, THE System SHALL block all features not listed in criterion 5

### Requirement 4: Reactivate Family

**User Story:** As a founder, I want to reactivate a suspended family, so that I can restore their access when the suspension reason is resolved.

#### Acceptance Criteria

1. WHEN a founder selects "Reactivate" from the family actions menu, THE Admin_Dashboard SHALL display a reactivation form with reason field, subscription restore option, invitation re-enable toggle, device re-enable toggle, protection re-enable toggle, and internal notes field
2. THE Admin_Dashboard SHALL require the founder to provide a reactivation reason before submission
3. WHEN the founder submits the reactivation form with valid data, THE Suspension_RPC SHALL restore the family to Active status within a database transaction
4. WHEN reactivation is successful, THE Suspension_RPC SHALL send a notification to all family members informing them of restored access
5. WHEN reactivation is successful, THE Suspension_RPC SHALL close all open appeals associated with the family
6. IF the reactivation submission fails, THEN THE Admin_Dashboard SHALL display the error message and retain all form field values

### Requirement 5: Suspended Families Page

**User Story:** As a founder, I want a dedicated page listing all suspended families, so that I can efficiently manage ongoing suspensions.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a dedicated "Suspended Families" page accessible from the sidebar navigation
2. THE Admin_Dashboard SHALL display all families with Restricted, Suspended, or Emergency_Only status on the Suspended Families page
3. WHEN a founder enters a search term, THE Admin_Dashboard SHALL filter suspended families by family name or owner name
4. THE Admin_Dashboard SHALL support filtering suspended families by Suspension_Level and by suspension date range
5. THE Admin_Dashboard SHALL paginate the suspended families list with a configurable page size
6. THE Admin_Dashboard SHALL provide action buttons for each suspended family: Extend Duration, Reactivate, Change Level, and Archive

### Requirement 6: Family Actions Menu

**User Story:** As a founder, I want a contextual actions menu per family, so that I can perform suspension-related operations efficiently.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display an actions menu for each family containing: View Details, Suspend, Change Restriction Level, Extend Duration, Reactivate, and View History
2. WHILE a family has Active status, THE Admin_Dashboard SHALL enable the Suspend action and disable Reactivate, Change Restriction Level, and Extend Duration actions
3. WHILE a family has a suspended status (Restricted, Suspended, or Emergency_Only), THE Admin_Dashboard SHALL enable Reactivate, Change Restriction Level, and Extend Duration actions and disable the Suspend action
4. WHEN a founder selects "View History", THE Admin_Dashboard SHALL display all audit log entries related to that family in chronological order

### Requirement 7: Audit Logging

**User Story:** As a founder, I want all suspension-related actions recorded in the audit log, so that I have a complete compliance trail.

#### Acceptance Criteria

1. WHEN a suspension action is performed, THE Suspension_RPC SHALL record an entry in the audit_logs table containing the actor ID, action type, target family ID, action metadata, and timestamp
2. THE Suspension_RPC SHALL record audit entries for these action types: suspend, level_change, duration_change, extend, reactivate, appeal_decision, and archive
3. THE Audit_Log entry SHALL include the previous state and new state of the family in the metadata field
4. THE Admin_Dashboard SHALL display audit log entries in a readable format with actor name, action description, timestamp, and metadata details

### Requirement 8: Backend Security

**User Story:** As a founder, I want suspension operations secured via SECURITY DEFINER RPCs, so that no unauthorized access or frontend key exposure occurs.

#### Acceptance Criteria

1. THE Suspension_RPC SHALL validate the caller JWT and confirm founder role via `is_founder(auth.uid())` before executing any operation
2. IF a non-founder user calls the Suspension_RPC, THEN THE Suspension_RPC SHALL return an authorization error and record no state changes
3. THE Suspension_RPC SHALL execute all state changes within a single database transaction to ensure atomicity
4. THE Suspension_RPC SHALL implement idempotency so that duplicate requests with the same parameters produce no additional side effects
5. THE Admin_Dashboard SHALL use only the Supabase anon key and call RPCs through the authenticated client; the service role key SHALL NOT be present in frontend code
6. WHEN the Suspension_RPC completes a suspension or reactivation, THE Suspension_RPC SHALL insert a notification record for affected family members

### Requirement 9: Mobile App Exclusion

**User Story:** As a product owner, I want the suspension management feature excluded from the mobile app, so that only authorized admins access these controls.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL be the sole interface for suspension management operations
2. THE System SHALL expose no suspension management endpoints or UI to the mobile user application
3. THE Suspension_RPC SHALL reject calls that do not originate from an authenticated founder session
