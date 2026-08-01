# Technical Design: Family Suspension Management

## Overview

This document describes the technical design for the Family Suspension Management feature. It covers database schema changes, SECURITY DEFINER RPCs, RLS policies, frontend components, and data flow.

## Architecture

The feature follows the existing Kinora admin dashboard architecture:

- **Frontend:** Vue 3 (Composition API) SPA with Tailwind CSS, embedded in the existing `DashboardPage.vue` sidebar navigation
- **Backend:** Supabase PostgreSQL with SECURITY DEFINER RPCs for all mutations
- **Auth:** Supabase Auth with JWT validation + `is_founder()` role check
- **Data Access:** Supabase JS client using anon key, RLS-protected queries for reads, RPC calls for writes
- **Notifications:** Database-driven via `notifications` table (inserted within RPC transactions)

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Vue 3 Frontend │────▶│  Supabase Client │────▶│  PostgreSQL RPC  │
│  (anon key+JWT) │     │  (REST/Realtime) │     │  (SECURITY DEF.) │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────────┐
                                                  │  families table  │
                                                  │  suspensions tbl │
                                                  │  audit_logs tbl  │
                                                  │  notifications   │
                                                  └──────────────────┘
```

## Components and Interfaces

| Component | Type | Interface |
|-----------|------|-----------|
| `FamilySuspendPage.vue` | Page component | Emits: none. Consumes: supabase queries |
| `SuspendFamilyModal.vue` | Modal component | Props: `family`. Emits: `suspended`, `close` |
| `ReactivateFamilyModal.vue` | Modal component | Props: `family`. Emits: `reactivated`, `close` |
| `SuspensionHistoryModal.vue` | Modal component | Props: `familyId`. Emits: `close` |
| `founder_suspend_family` | PostgreSQL RPC | Params → JSONB response |
| `founder_reactivate_family` | PostgreSQL RPC | Params → JSONB response |
| `founder_change_suspension_level` | PostgreSQL RPC | Params → JSONB response |
| `founder_extend_suspension` | PostgreSQL RPC | Params → JSONB response |

## Data Models

### `family_suspensions` (new table)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| family_id | UUID | FK → families(id), NOT NULL |
| level | TEXT | CHECK IN (restricted, full_suspension, emergency_only) |
| reason | TEXT | NOT NULL |
| admin_notes | TEXT | nullable |
| user_message | TEXT | nullable |
| start_date | TIMESTAMPTZ | NOT NULL, default now() |
| end_date | TIMESTAMPTZ | nullable |
| auto_reactivate | BOOLEAN | NOT NULL, default false |
| allow_appeal | BOOLEAN | NOT NULL, default true |
| subscription_policy | TEXT | CHECK IN (pause, cancel, keep), default 'pause' |
| block_payments | BOOLEAN | NOT NULL, default false |
| block_invitations | BOOLEAN | NOT NULL, default true |
| block_device_commands | BOOLEAN | NOT NULL, default false |
| keep_emergency_access | BOOLEAN | NOT NULL, default true |
| status | TEXT | CHECK IN (active, completed, archived), default 'active' |
| created_by | UUID | FK → auth.users(id), NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

### `families` (altered)

| Column Added | Type | Constraints |
|-------------|------|-------------|
| suspension_status | TEXT | CHECK IN (active, under_review, restricted, suspended, archived), default 'active' |

---

## 1. Database Changes

### 1.1 New Table: `family_suspensions`

```sql
CREATE TABLE family_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('restricted', 'full_suspension', 'emergency_only')),
  reason TEXT NOT NULL,
  admin_notes TEXT,
  user_message TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  auto_reactivate BOOLEAN NOT NULL DEFAULT false,
  allow_appeal BOOLEAN NOT NULL DEFAULT true,
  subscription_policy TEXT DEFAULT 'pause' CHECK (subscription_policy IN ('pause', 'cancel', 'keep')),
  block_payments BOOLEAN NOT NULL DEFAULT false,
  block_invitations BOOLEAN NOT NULL DEFAULT true,
  block_device_commands BOOLEAN NOT NULL DEFAULT false,
  keep_emergency_access BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_suspensions_family_id ON family_suspensions(family_id);
CREATE INDEX idx_family_suspensions_status ON family_suspensions(status);
CREATE INDEX idx_family_suspensions_level ON family_suspensions(level);
CREATE INDEX idx_family_suspensions_end_date ON family_suspensions(end_date) WHERE auto_reactivate = true AND status = 'active';
```

### 1.2 Alter Table: `families`

```sql
ALTER TABLE families
  ADD COLUMN suspension_status TEXT NOT NULL DEFAULT 'active'
    CHECK (suspension_status IN ('active', 'under_review', 'restricted', 'suspended', 'archived'));

CREATE INDEX idx_families_suspension_status ON families(suspension_status);
```

### 1.3 Existing Table: `audit_logs`

Uses the existing `audit_logs` table. Expected schema:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| actor_id | UUID | User who performed the action |
| action | TEXT | Action type (e.g., `family.suspend`, `family.reactivate`) |
| target_type | TEXT | `family` |
| target_id | UUID | Family ID |
| metadata | JSONB | Previous state, new state, parameters |
| created_at | TIMESTAMPTZ | Timestamp |

---

## 2. RPC Functions (SECURITY DEFINER)

All RPCs:
- Validate JWT via `auth.uid()`
- Check founder role via `is_founder(auth.uid())`
- Execute within a single transaction
- Write to `audit_logs`
- Are idempotent (duplicate calls with same params produce no additional side effects)

### 2.1 `founder_suspend_family`

```sql
CREATE OR REPLACE FUNCTION founder_suspend_family(
  p_family_id UUID,
  p_level TEXT,
  p_reason TEXT,
  p_admin_notes TEXT DEFAULT NULL,
  p_user_message TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT now(),
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_auto_reactivate BOOLEAN DEFAULT false,
  p_allow_appeal BOOLEAN DEFAULT true,
  p_config JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_suspension_id UUID;
  v_prev_status TEXT;
  v_new_family_status TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF NOT is_founder(v_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized: caller is not a founder';
  END IF;

  -- Get current status
  SELECT suspension_status INTO v_prev_status FROM families WHERE id = p_family_id;
  IF v_prev_status IS NULL THEN
    RAISE EXCEPTION 'Family not found';
  END IF;

  -- Idempotency: skip if already at same level
  IF EXISTS (
    SELECT 1 FROM family_suspensions
    WHERE family_id = p_family_id AND level = p_level AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('status', 'already_suspended', 'level', p_level);
  END IF;

  -- Mark any existing active suspensions as completed
  UPDATE family_suspensions
  SET status = 'completed', updated_at = now()
  WHERE family_id = p_family_id AND status = 'active';

  -- Determine new family status
  v_new_family_status := CASE p_level
    WHEN 'restricted' THEN 'restricted'
    WHEN 'full_suspension' THEN 'suspended'
    WHEN 'emergency_only' THEN 'suspended'
  END;

  -- Create suspension record
  INSERT INTO family_suspensions (
    family_id, level, reason, admin_notes, user_message,
    start_date, end_date, auto_reactivate, allow_appeal,
    subscription_policy, block_payments, block_invitations,
    block_device_commands, keep_emergency_access, created_by
  ) VALUES (
    p_family_id, p_level, p_reason, p_admin_notes, p_user_message,
    p_start_date, p_end_date, p_auto_reactivate, p_allow_appeal,
    COALESCE(p_config->>'subscription_policy', 'pause'),
    COALESCE((p_config->>'block_payments')::boolean, false),
    COALESCE((p_config->>'block_invitations')::boolean, true),
    COALESCE((p_config->>'block_device_commands')::boolean, false),
    COALESCE((p_config->>'keep_emergency_access')::boolean, true),
    v_actor_id
  ) RETURNING id INTO v_suspension_id;

  -- Update family status
  UPDATE families
  SET suspension_status = v_new_family_status, updated_at = now()
  WHERE id = p_family_id;

  -- Audit log
  INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    v_actor_id, 'family.suspend', 'family', p_family_id,
    jsonb_build_object(
      'previous_status', v_prev_status,
      'new_status', v_new_family_status,
      'level', p_level,
      'reason', p_reason,
      'suspension_id', v_suspension_id
    )
  );

  -- Notification for family members
  INSERT INTO notifications (user_id, title, body, type, metadata)
  SELECT
    fm.user_id,
    'Akun Keluarga Dibatasi',
    COALESCE(p_user_message, 'Akun keluarga Anda telah dibatasi oleh administrator.'),
    'family_suspension',
    jsonb_build_object('family_id', p_family_id, 'level', p_level)
  FROM family_members fm
  WHERE fm.family_id = p_family_id AND fm.status = 'active';

  RETURN jsonb_build_object(
    'status', 'success',
    'suspension_id', v_suspension_id,
    'family_status', v_new_family_status
  );
END;
$$;
```

### 2.2 `founder_reactivate_family`

```sql
CREATE OR REPLACE FUNCTION founder_reactivate_family(
  p_family_id UUID,
  p_reason TEXT,
  p_restore_subscription BOOLEAN DEFAULT true,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_prev_status TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF NOT is_founder(v_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized: caller is not a founder';
  END IF;

  SELECT suspension_status INTO v_prev_status FROM families WHERE id = p_family_id;
  IF v_prev_status IS NULL THEN
    RAISE EXCEPTION 'Family not found';
  END IF;

  -- Idempotency
  IF v_prev_status = 'active' THEN
    RETURN jsonb_build_object('status', 'already_active');
  END IF;

  -- Complete active suspensions
  UPDATE family_suspensions
  SET status = 'completed', updated_at = now()
  WHERE family_id = p_family_id AND status = 'active';

  -- Restore family status
  UPDATE families
  SET suspension_status = 'active', updated_at = now()
  WHERE id = p_family_id;

  -- Close open appeals
  UPDATE family_appeals
  SET status = 'closed', resolved_at = now(), resolved_by = v_actor_id
  WHERE family_id = p_family_id AND status = 'open';

  -- Audit log
  INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    v_actor_id, 'family.reactivate', 'family', p_family_id,
    jsonb_build_object(
      'previous_status', v_prev_status,
      'new_status', 'active',
      'reason', p_reason,
      'restore_subscription', p_restore_subscription,
      'notes', p_notes
    )
  );

  -- Notification
  INSERT INTO notifications (user_id, title, body, type, metadata)
  SELECT
    fm.user_id,
    'Akun Keluarga Diaktifkan Kembali',
    'Akun keluarga Anda telah diaktifkan kembali. Semua fitur telah tersedia.',
    'family_reactivation',
    jsonb_build_object('family_id', p_family_id)
  FROM family_members fm
  WHERE fm.family_id = p_family_id AND fm.status = 'active';

  RETURN jsonb_build_object('status', 'success', 'family_status', 'active');
END;
$$;
```

### 2.3 `founder_change_suspension_level`

```sql
CREATE OR REPLACE FUNCTION founder_change_suspension_level(
  p_family_id UUID,
  p_new_level TEXT,
  p_reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_prev_level TEXT;
  v_new_family_status TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF NOT is_founder(v_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized: caller is not a founder';
  END IF;

  -- Get current active suspension
  SELECT level INTO v_prev_level
  FROM family_suspensions
  WHERE family_id = p_family_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  IF v_prev_level IS NULL THEN
    RAISE EXCEPTION 'No active suspension found for this family';
  END IF;

  -- Idempotency
  IF v_prev_level = p_new_level THEN
    RETURN jsonb_build_object('status', 'no_change', 'level', p_new_level);
  END IF;

  v_new_family_status := CASE p_new_level
    WHEN 'restricted' THEN 'restricted'
    WHEN 'full_suspension' THEN 'suspended'
    WHEN 'emergency_only' THEN 'suspended'
  END;

  -- Update suspension level
  UPDATE family_suspensions
  SET level = p_new_level, updated_at = now()
  WHERE family_id = p_family_id AND status = 'active';

  -- Update family status
  UPDATE families
  SET suspension_status = v_new_family_status, updated_at = now()
  WHERE id = p_family_id;

  -- Audit log
  INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    v_actor_id, 'family.level_change', 'family', p_family_id,
    jsonb_build_object(
      'previous_level', v_prev_level,
      'new_level', p_new_level,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'previous_level', v_prev_level,
    'new_level', p_new_level
  );
END;
$$;
```

### 2.4 `founder_extend_suspension`

```sql
CREATE OR REPLACE FUNCTION founder_extend_suspension(
  p_family_id UUID,
  p_new_end_date TIMESTAMPTZ,
  p_reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_prev_end_date TIMESTAMPTZ;
BEGIN
  v_actor_id := auth.uid();
  IF NOT is_founder(v_actor_id) THEN
    RAISE EXCEPTION 'Unauthorized: caller is not a founder';
  END IF;

  -- Get current end date
  SELECT end_date INTO v_prev_end_date
  FROM family_suspensions
  WHERE family_id = p_family_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active suspension found for this family';
  END IF;

  -- Update end date
  UPDATE family_suspensions
  SET end_date = p_new_end_date, updated_at = now()
  WHERE family_id = p_family_id AND status = 'active';

  -- Audit log
  INSERT INTO audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    v_actor_id, 'family.extend', 'family', p_family_id,
    jsonb_build_object(
      'previous_end_date', v_prev_end_date,
      'new_end_date', p_new_end_date,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'previous_end_date', v_prev_end_date,
    'new_end_date', p_new_end_date
  );
END;
$$;
```

---

## 3. RLS Policies

### 3.1 `family_suspensions` Table

```sql
ALTER TABLE family_suspensions ENABLE ROW LEVEL SECURITY;

-- Founders can do everything
CREATE POLICY "founders_all_access" ON family_suspensions
  FOR ALL
  TO authenticated
  USING (is_founder(auth.uid()))
  WITH CHECK (is_founder(auth.uid()));

-- Family members can view their own family's suspension
CREATE POLICY "members_view_own_suspension" ON family_suspensions
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.status = 'active'
    )
  );
```

---

## 4. Frontend Components

### 4.1 `FamilySuspendPage.vue`

- **Location:** `src/pages/FamilySuspendPage.vue`
- **Purpose:** Dedicated page listing all suspended/restricted families
- **Integration:** Embedded in `DashboardPage.vue` as a new menu item (`activeMenu === 'suspensions'`)
- **Features:**
  - Status badges (Active, Under_Review, Restricted, Suspended, Archived) with color coding
  - Search by family name or owner name
  - Filter by suspension level and date range
  - Paginated list with configurable page size
  - Actions per family: Extend Duration, Reactivate, Change Level, Archive
  - Sort by most recently updated

**Key data flow:**
```javascript
// Load suspended families
const { data } = await supabase
  .from('families')
  .select('*, family_suspensions!inner(*)')
  .in('suspension_status', ['restricted', 'suspended'])
  .order('updated_at', { ascending: false })
```

### 4.2 `SuspendFamilyModal.vue`

- **Location:** `src/components/SuspendFamilyModal.vue`
- **Purpose:** Modal form for creating a new suspension
- **Props:** `family` (Object — target family data)
- **Emits:** `suspended`, `close`
- **Form fields:**
  - Family summary (read-only display)
  - Suspension level selector (restricted / full_suspension / emergency_only)
  - Reason (required textarea)
  - Admin notes (optional textarea)
  - User-facing message (optional textarea)
  - Start date (default: now)
  - End date (optional)
  - Auto-reactivate toggle (shown when end_date is set)
  - Allow appeal toggle
  - Subscription policy (pause / cancel / keep)
  - Blocking options: block_payments, block_invitations, block_device_commands
  - Keep emergency access toggle

**Validation:**
- Level must be selected
- Reason is required (min 10 chars)
- End date must be after start date (if provided)

**Submission:**
```javascript
const { data, error } = await supabase.rpc('founder_suspend_family', {
  p_family_id: family.id,
  p_level: form.level,
  p_reason: form.reason,
  p_admin_notes: form.adminNotes || null,
  p_user_message: form.userMessage || null,
  p_start_date: form.startDate,
  p_end_date: form.endDate || null,
  p_auto_reactivate: form.autoReactivate,
  p_allow_appeal: form.allowAppeal,
  p_config: {
    subscription_policy: form.subscriptionPolicy,
    block_payments: form.blockPayments,
    block_invitations: form.blockInvitations,
    block_device_commands: form.blockDeviceCommands,
    keep_emergency_access: form.keepEmergencyAccess
  }
})
```

### 4.3 `ReactivateFamilyModal.vue`

- **Location:** `src/components/ReactivateFamilyModal.vue`
- **Purpose:** Modal form for reactivating a suspended family
- **Props:** `family` (Object)
- **Emits:** `reactivated`, `close`
- **Form fields:**
  - Reason (required textarea)
  - Restore subscription toggle
  - Re-enable invitations toggle
  - Re-enable device commands toggle
  - Re-enable protection features toggle
  - Internal notes (optional textarea)

**Submission:**
```javascript
const { data, error } = await supabase.rpc('founder_reactivate_family', {
  p_family_id: family.id,
  p_reason: form.reason,
  p_restore_subscription: form.restoreSubscription,
  p_notes: form.notes || null
})
```

### 4.4 `SuspensionHistoryModal.vue`

- **Location:** `src/components/SuspensionHistoryModal.vue`
- **Purpose:** Display audit log entries for a specific family's suspension history
- **Props:** `familyId` (UUID)
- **Emits:** `close`
- **Features:**
  - Chronological list of all suspension-related audit log entries
  - Displays: actor name, action description, timestamp, metadata details
  - Action type badges (suspend, reactivate, level_change, extend, archive)
  - Expandable metadata details per entry

**Data loading:**
```javascript
const { data } = await supabase
  .from('audit_logs')
  .select('*, actor:users!actor_id(display_name)')
  .eq('target_type', 'family')
  .eq('target_id', familyId)
  .in('action', [
    'family.suspend', 'family.reactivate',
    'family.level_change', 'family.extend', 'family.archive'
  ])
  .order('created_at', { ascending: true })
```

### 4.5 DashboardPage.vue Integration

Add to `menuItems` array:
```javascript
{ id: 'suspensions', label: 'Suspensi Keluarga' }
```

Add template section:
```html
<div v-if="activeMenu === 'suspensions'">
  <FamilySuspendPage />
</div>
```

Add import:
```javascript
import FamilySuspendPage from './FamilySuspendPage.vue'
```

---

## 5. Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Founder clicks action (Suspend/Reactivate/Change/Extend)     │
│                          │                                        │
│  2. Modal opens with form                                        │
│                          │                                        │
│  3. Form submitted (validated client-side)                       │
│                          │                                        │
│  4. supabase.rpc() called via anon key + JWT                     │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  5. RPC validates JWT + is_founder()                             │
│                          │                                        │
│  6. BEGIN transaction                                            │
│     - Update family_suspensions                                  │
│     - Update families.suspension_status                          │
│     - INSERT audit_logs                                          │
│     - INSERT notifications                                       │
│  7. COMMIT                                                       │
│                          │                                        │
│  8. Return JSONB result                                          │
│                                                                   │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend Response                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  9. On success: close modal, refresh family list, show toast     │
│  10. On error: display error message, retain form values         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Status Badge Color Mapping

| Status | Badge Color | Tailwind Classes |
|--------|-------------|------------------|
| active | Green | `bg-green-100 text-green-700` |
| under_review | Yellow | `bg-yellow-100 text-yellow-700` |
| restricted | Orange | `bg-orange-100 text-orange-700` |
| suspended | Red | `bg-red-100 text-red-700` |
| archived | Gray | `bg-gray-100 text-gray-500` |

---

## 7. Security Considerations

- All mutation operations go through SECURITY DEFINER RPCs — no direct table writes from the client
- Frontend uses only the Supabase anon key (`VITE_SUPABASE_ANON_KEY`)
- RPCs validate `is_founder(auth.uid())` as the first operation
- RLS policies on `family_suspensions` restrict read access to founders + own family members
- All state changes are atomic (single transaction per RPC)
- Audit trail is immutable — no UPDATE/DELETE policies on `audit_logs` for non-service roles

---

## 8. Auto-Reactivation (Future/Cron)

When `auto_reactivate = true` and `end_date` is set, a scheduled function (pg_cron or Supabase Edge Function cron) should:

1. Query `family_suspensions` where `status = 'active' AND auto_reactivate = true AND end_date <= now()`
2. Call internal reactivation logic (same as `founder_reactivate_family` but with system actor)
3. Write audit log with `actor_id = system`

This is out of scope for the initial implementation but the schema supports it via the `idx_family_suspensions_end_date` partial index.

---

## 9. Component File Summary

| File | Type | Purpose |
|------|------|---------|
| `src/pages/FamilySuspendPage.vue` | Page | Suspended families list with filters and actions |
| `src/components/SuspendFamilyModal.vue` | Modal | Suspend family form |
| `src/components/ReactivateFamilyModal.vue` | Modal | Reactivate family form |
| `src/components/SuspensionHistoryModal.vue` | Modal | Audit log viewer per family |
| `src/pages/DashboardPage.vue` | Page | Add sidebar menu item + embed FamilySuspendPage |

---

## Error Handling

| Scenario | Handler | Behavior |
|----------|---------|----------|
| Non-founder calls RPC | RPC | RAISE EXCEPTION → 403 returned to client |
| Family not found | RPC | RAISE EXCEPTION → error message to UI |
| No active suspension (for change/extend) | RPC | RAISE EXCEPTION → error message to UI |
| Duplicate suspension (idempotency) | RPC | Return `already_suspended` status, no side effects |
| Already active (reactivation) | RPC | Return `already_active` status, no side effects |
| Network/Supabase error | Frontend | Display error toast, retain form values |
| Validation failure (missing fields) | Frontend | Disable submit button, show inline errors |
| Transaction failure | PostgreSQL | Automatic ROLLBACK, no partial state changes |

---

## Testing Strategy

- **RPC unit tests:** Use Supabase SQL test harness or pgTAP to verify:
  - Founder auth check rejects non-founders
  - Suspension creates correct records and updates family status
  - Idempotency returns early without duplicate writes
  - Audit logs are written with correct metadata
  - Notifications are created for active family members
- **Frontend component tests:** Vitest + Vue Test Utils:
  - Modal renders correct form fields
  - Validation prevents submission with missing required fields
  - Successful submission emits correct events
  - Error state displays error message and retains form data
- **Integration tests:** Manual or E2E (Playwright):
  - Full flow: suspend → verify status badge → reactivate → verify restored
  - Filter/search on suspended families page
  - Audit history displays correct entries
