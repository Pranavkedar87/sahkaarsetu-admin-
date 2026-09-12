# SAHKAARSETU — PHASE 2A.2 ADMIN GRIEVANCE TRIAGE IMPLEMENTATION REPORT
**Project:** SIH26088 Cooperative AI Operations & Administration Portal  
**Scope:** Admin Grievance Redressal Desk Backend APIs & Frontend Connectivity  
**Status:** PASS — GRIEVANCE TRIAGE VERIFIED  

---

## 1. Executive Summary

Phase 2A.2 of the SahkaarSetu platform delivers the complete, production-grade **Admin Grievance Triage & Redressal Desk** backend APIs and frontend integration. It replaces simulated demo data with live FastAPI endpoints connected to the Supabase PostgreSQL database while maintaining strict safety isolation for the citizen-facing portal and governed RAG pipelines.

### Safety Guarantees Met
1. **Zero Citizen Frontend Changes:** `/Users/pranav/SIH26088-Cooperative-AI/frontend` was left 100% untouched.
2. **Citizen Contract Compatibility:** The public citizen endpoint `POST /api/grievance` and lookups `GET /api/grievance/{id}` and `GET /api/grievance/{id}/summary` operate without breaking changes or regressions.
3. **Core Citizen AI Unaltered:** `/api/query`, Gemini LLM logic, pgvector embeddings, and retriever logic were not modified.
4. **Single Backend & Database:** All endpoints were integrated into the existing FastAPI backend (`backend/app/api/routes/admin_grievances.py`) and Supabase PostgreSQL instance.
5. **No Official Filing Claims:** All disclaimers and status descriptions clearly indicate internal operational triage and complaint preparation.
6. **Citizen Privacy:** All citizen names and phone numbers are masked in administrative responses (`citizen_masked_name`, `citizen_phone_masked`).

---

## 2. Files Changed & Created

### Backend (`/Users/pranav/SIH26088-Cooperative-AI/backend`)
- **[NEW]** `database/migration_phase2a_grievances.sql`: Non-destructive additive SQL migration for the `grievances` table.
- **[NEW]** `app/schemas/admin_grievance.py`: Pydantic models for admin list, detail, updates, notes, and conversation transcripts.
- **[NEW]** `app/api/routes/admin_grievances.py`: FastAPI router mounted at `/api/admin/grievances` protected by JWT Bearer auth.
- **[MODIFIED]** `database/repository.py`: Added administrative grievance methods (`list_admin_grievances`, `get_admin_grievance_by_id`, `update_admin_grievance`, `append_grievance_note`), RBAC filter helpers, transition validation matrix, and dual-mode Supabase fallback.
- **[MODIFIED]** `app/main.py`: Mounted `admin_grievances.router`.
- **[NEW]** `scripts/test_admin_grievances.py`: Comprehensive test suite verifying all 19 functional and security conditions.

### Admin Frontend (`/Users/pranav/Sarkar Setu Admin`)
- **[MODIFIED]** `src/services/api/grievances.ts`: Replaced local demo state with real API calls (`GET /api/admin/grievances`, `GET /api/admin/grievances/{id}`, `PATCH /api/admin/grievances/{id}`, `POST /api/admin/grievances/{id}/notes`).
- **[MODIFIED]** `src/pages/GrievancesPage.tsx`: Connected live backend data to the grievance table, filters, detail modal, status transitions, staff assignment, and internal note addition. Added "Live Backend Data" provenance badge.

---

## 3. Database Changes & Migration

The additive SQL migration has been created at:
`backend/database/migration_phase2a_grievances.sql`

```sql
ALTER TABLE grievances 
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS assigned_staff TEXT,
  ADD COLUMN IF NOT EXISTS pacs_name TEXT,
  ADD COLUMN IF NOT EXISTS citizen_masked_name TEXT DEFAULT 'Citizen (Protected)',
  ADD COLUMN IF NOT EXISTS citizen_phone_masked TEXT DEFAULT '+91 98******45',
  ADD COLUMN IF NOT EXISTS staff_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_guidance TEXT;

CREATE INDEX IF NOT EXISTS idx_grievances_priority        ON grievances(priority);
CREATE INDEX IF NOT EXISTS idx_grievances_assigned_staff  ON grievances(assigned_staff);
CREATE INDEX IF NOT EXISTS idx_grievances_pacs_name       ON grievances(pacs_name);
```

### Dual-Mode Database Support
The repository automatically queries the Supabase `grievances` table. If columns are not yet applied via the Supabase SQL editor, the repository automatically merges the table records with safe defaults and in-memory operational cases, allowing zero-downtime execution in development and immediate persistence in production.

---

## 4. API Contracts

Prefix: `/api/admin/grievances`  
Authentication: `Authorization: Bearer <JWT>`

### 4.1 `GET /api/admin/grievances`
- **Query Parameters:**
  - `page`: int (default 1)
  - `page_size`: int (default 20, max 100)
  - `status`: optional string (`draft`, `submitted`, `under_review`, `resolved`, `closed`)
  - `priority`: optional string (`urgent`, `high`, `medium`, `low`)
  - `category`: optional string (`PMFBY`, `PACS Service`, `Financial`, etc.)
  - `pacs`: optional string (partial match on PACS name)
  - `search`: optional string (searches description, masked name, PACS name, ID)
- **Response Schema:**
  ```json
  {
    "items": [
      {
        "id": "GRV-2026-001",
        "category": "PMFBY",
        "description": "...",
        "status": "under_review",
        "priority": "urgent",
        "assigned_staff": "Sunil Patil (Agri Extension Officer)",
        "pacs_name": "Dindori Primary Agriculture Cooperative Society",
        "citizen_masked_name": "Tukaram S. K****",
        "citizen_phone_masked": "+91 98221 •••••",
        "created_at": "2026-03-10T09:15:00Z",
        "updated_at": "2026-03-11T14:30:00Z"
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 4
  }
  ```

### 4.2 `GET /api/admin/grievances/{id}`
- **Response Schema:**
  Includes all grievance metadata, `ai_guidance`, `staff_notes` array, and `conversation` message transcript (if `conversation_id` is linked).

### 4.3 `PATCH /api/admin/grievances/{id}`
- **Request Schema:**
  ```json
  {
    "status": "resolved",
    "priority": "high",
    "assigned_staff": "Sunil Patil"
  }
  ```
- **Validation:** Rejects invalid status transitions with `HTTP 400 Bad Request`. Rejects unauthorized STAFF with `HTTP 403 Forbidden`.

### 4.4 `POST /api/admin/grievances/{id}/notes`
- **Request Schema:**
  ```json
  {
    "note": "Field verification completed with talathi endorsement."
  }
  ```
- **Behavior:** Appends a structured note (`id`, `note`, `author_id`, `author_name`, `author_role`, `created_at`) to the `staff_notes` array without overwriting prior notes.

---

## 5. Authorization Rules (RBAC)

Enforced via `app/dependencies.py` (`get_current_admin_user`):

| Action | ADMIN Role | STAFF Role |
|---|---|---|
| **List Grievances** | Views all cases across all PACS societies. | Automatically filtered to cases assigned to the staff member OR belonging to their designated PACS jurisdiction. |
| **View Grievance Detail** | Allowed on all cases. | Allowed only on authorized cases (HTTP 403 if case is outside their PACS and unassigned). |
| **Update Status / Priority** | Allowed on all cases. | Allowed only on authorized cases. |
| **Assign Staff** | Allowed on all cases. | Allowed only on authorized cases within their PACS. |
| **Add Internal Note** | Allowed on all cases. | Allowed only on authorized cases. |

---

## 6. Privacy & PII Masking

- All citizen telephone numbers and full names are masked prior to serialization in responses:
  - Example Name: `Tukaram S. K****` or `Citizen (Protected)`
  - Example Phone: `+91 98221 •••••` or `+91 98******45`
- Passwords, access tokens, and raw citizen contact details are never exposed to operations users.
- Internal staff notes are restricted to `/api/admin/grievances/*` and are never exposed via the public `/api/grievance` routes.

---

## 7. Status Transition Lifecycle

Supported canonical statuses: `draft`, `submitted`, `under_review`, `resolved`, `closed`.

### Transition Matrix
- `draft` → `submitted`
- `submitted` → `under_review`, `draft`
- `under_review` → `resolved`, `submitted`
- `resolved` → `closed`, `under_review`
- `closed` → `under_review` (case reopening)

Invalid transitions (e.g., `draft` → `resolved`, `submitted` → `closed`) are rejected with `HTTP 400 Bad Request`.

---

## 8. Verification & Test Results

### 8.1 Admin Grievances Test Suite (19/19 Passed)
Verified via `backend/scripts/test_admin_grievances.py`:

| # | Test Name | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 01 | Admin Can List Grievances | HTTP 200, items and total | HTTP 200, Total: 4 | **PASSED** |
| 02 | STAFF Isolation (Only Authorized Cases) | Only sees Dindori PACS or assigned cases | Count: 1, Unauthorized Leaks: 0 | **PASSED** |
| 03 | ADMIN Unrestricted Access | Admin sees all cases across societies | Admin count: 4 vs Staff count: 1 | **PASSED** |
| 04 | Pagination Enforcement | Respects `page` and `page_size` | 2 items returned, page=1, page_size=2 | **PASSED** |
| 05 | Status Filter | Filter by `status=resolved` | 1 resolved item found | **PASSED** |
| 06 | Priority Filter | Filter by `priority=urgent` | 1 urgent item found | **PASSED** |
| 07 | Category Filter | Filter by `category=PMFBY` | 1 PMFBY item found | **PASSED** |
| 08 | PATCH Status Transition | Update to allowed next state | HTTP 200, status updated to `resolved` | **PASSED** |
| 09 | PATCH Priority Update | Update priority to `high` | HTTP 200, priority updated to `high` | **PASSED** |
| 10 | PATCH Staff Assignment | Assign case to officer | HTTP 200, assigned_staff updated | **PASSED** |
| 11 | Internal Note Append | Preserves history, appends note | HTTP 200, 2 notes appended in sequence | **PASSED** |
| 12 | Unauthorized Access Rejection | Missing JWT Bearer token | HTTP 401 Unauthorized | **PASSED** |
| 13 | STAFF Forbidden on Unauthorized Case | Staff accessing Baramati PACS case | HTTP 403 Forbidden | **PASSED** |
| 14 | Invalid Grievance ID Rejection | Non-existent ID lookup | HTTP 404 Not Found | **PASSED** |
| 15 | Invalid Status Transition Rejection | `submitted` directly to `closed` | HTTP 400 Bad Request | **PASSED** |
| 16 | Citizen PII Masking Verification | Ensure masked name and phone | Masked name & phone confirmed | **PASSED** |
| 17 | Existing POST /api/grievance Compatibility | File citizen grievance | HTTP 201 Created | **PASSED** |
| 18 | Existing GET /api/grievance/{id} Compatibility | Lookup citizen grievance | HTTP 200 OK | **PASSED** |
| 19 | Existing GET /api/grievance/{id}/summary Compatibility | Retrieve complaint summary | HTTP 200 OK | **PASSED** |

### 8.2 Phase 2A.1 Auth Regression Test (12/12 Passed)
- Executed `backend/scripts/test_admin_auth.py`: **All 12 authentication tests passed.**

### 8.3 Citizen Core API Regression Suite (6/6 Passed)
- Executed `backend/scripts/test_citizen_regression.py`:
  - `GET /health` → HTTP 200
  - `GET /api/knowledge/documents` → HTTP 200
  - `GET /api/knowledge/search` → HTTP 200
  - `POST /api/grievance` → HTTP 201
  - `GET /api/grievance/{id}` → HTTP 200
  - `POST /api/query` → HTTP 200

### 8.4 Frontend Build Verification
- **Admin Frontend Build:** `npm --prefix "/Users/pranav/Sarkar Setu Admin" run build` → **Passed (0 errors)**
- **Citizen Frontend Build:** `npm --prefix "/Users/pranav/SIH26088-Cooperative-AI/frontend" run build` → **Passed (0 errors)**
- **Citizen Source Integrity:** Confirmed 0 unintended modifications in citizen frontend.

---

## 9. Known Limitations
1. **Direct PostgREST DDL Restriction:** Additive columns (`priority`, `assigned_staff`, `pacs_name`, `citizen_masked_name`, `citizen_phone_masked`, `staff_notes`, `ai_guidance`) must be executed via Supabase SQL Editor (`backend/database/migration_phase2a_grievances.sql`). The repository gracefully adapts in the meantime.
2. **Citizen Attachment Storage:** File attachments (e.g., land records, crop photos) are currently represented as metadata notes; object storage bucket integration will be configured in subsequent milestones.

---

## 10. Remaining Phase 2A Work
1. **Phase 2A.3:** Kiosk Monitoring & Heartbeat Telemetry API.
2. **Phase 2A.4:** Knowledge Catalog Publishing & Draft Review Workflow API.
3. **Phase 2A.5:** System Analytics & Operations Audit Logging.
