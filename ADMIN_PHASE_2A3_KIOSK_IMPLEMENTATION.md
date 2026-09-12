# SahkaarSetu Admin Portal — Phase 2A.3 Implementation Report
## Kiosk Fleet Monitoring & Telemetry Redressal

**Implementation Date:** September 13, 2026  
**Status:** **PASS — KIOSK MONITORING VERIFIED**  
**Classification:** Operational Fleet Telemetry & Centralized Health Monitoring

---

## 1. Executive Summary

Phase 2A.3 of the SahkaarSetu platform successfully delivers automated machine-to-machine (M2M) telemetry ingestion and centralized fleet monitoring for physical citizen-assistance touchpoints across Primary Agricultural Credit Societies (PACS) in Maharashtra.

### Core Architectural Guarantees
1. **Zero Remote Execution / Monitoring Only**:
   - Strictly NO remote reboot (`/reboot`), power control, shutdown, shell execution, firmware flashing, or peripheral control endpoints have been created.
   - Remote device manipulation is explicitly rejected with `HTTP 404 / 405`. The architecture safely restricts backend capability to telemetry ingestion and operational status tracking.
2. **Citizen Project Safety & Isolation**:
   - Citizen frontend (`/Users/pranav/SIH26088-Cooperative-AI/frontend`) was **100% untouched** (0 lines modified, verified via `git status`).
   - Citizen RAG pipeline, Gemini 2.5 Flash model invocation, pgvector embeddings, voice STT/TTS, and vision document verification remain completely unaltered.
3. **Hardware Credential Isolation**:
   - Kiosk heartbeat reporting requires a per-device machine key (`X-Kiosk-Key` or `Authorization: Bearer <key>`).
   - Keys are validated against cryptographic SHA-256 hashes (`api_key_hash`) stored in the database.
   - Plaintext credentials are **never stored in the database** and **never hardcoded in Git repositories or source files**.
4. **Deterministic Liveness Calculation**:
   - Kiosk availability is evaluated dynamically based on a **15-minute threshold (900 seconds)** from the last reported heartbeat.
   - If `(now - last_heartbeat) > 900s`, status resolves to `offline`.
   - Heartbeat receipt transitions `offline -> online`, but **strictly preserves** any administrative `maintenance` flag until an operator clears it manually.
5. **Strict PACS Society Role-Based Access Control (RBAC)**:
   - `ADMIN`: Global fleet visibility across all districts and PACS societies.
   - `STAFF`: Scoped strictly to their assigned PACS society (e.g. `Dindori Primary Agriculture Cooperative Society`). Requests for devices outside their assigned scope return `HTTP 403 Forbidden`.

---

## 2. API Specifications & Endpoints Implemented

| Method | Endpoint | Auth Mechanism | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/kiosks/{id}/heartbeat` | `X-Kiosk-Key` or `Bearer <key>` | M2M telemetry reporting. Ingests subsystem health, network status, software version, IP. |
| `GET` | `/api/admin/kiosks` | Admin JWT Bearer | Lists monitored kiosks with pagination, search, district/PACS/status filters, and RBAC isolation. |
| `GET` | `/api/admin/kiosks/{id}` | Admin JWT Bearer | Detailed kiosk diagnostics and telemetry logs. Enforces 403 for unauthorized staff. |
| `PATCH`| `/api/admin/kiosks/{id}` | Admin JWT Bearer | Controlled operational status change (`online`, `maintenance`) and staff notes append. |
| `POST` | `/api/kiosks/{id}/reboot` | Any | **DOES NOT EXIST (`HTTP 404`)**. Remote rebooting is disallowed by design. |

---

## 3. Database Schema Migration

An additive migration script was created at `backend/database/migration_phase2a_kiosks.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.kiosks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    pacs_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    ip_address TEXT,
    software_version TEXT NOT NULL DEFAULT 'v2.4.1',
    installation_date TEXT,
    uptime_percent DOUBLE PRECISION DEFAULT 99.0,
    health JSONB NOT NULL DEFAULT '{"device":"ok","network":"online","printer":"ready","sync":"synced"}'::jsonb,
    last_heartbeat TIMESTAMPTZ,
    api_key_hash TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kiosks_pacs ON public.kiosks(pacs_name);
CREATE INDEX IF NOT EXISTS idx_kiosks_status ON public.kiosks(status);
CREATE INDEX IF NOT EXISTS idx_kiosks_district ON public.kiosks(district);
```

---

## 4. Frontend Integration in Sarkar Setu Admin

The Admin operations frontend at `/Users/pranav/Sarkar Setu Admin` was upgraded with live backend connectivity:
- **API Service** (`src/services/api/kiosks.ts`):
  - Fetches fleet data via `GET /api/admin/kiosks` using authenticated JWT client.
  - Maps backend records to UI models while preserving hardware telemetry properties.
  - Updates operational status in real-time via `PATCH /api/admin/kiosks/{id}`.
- **Kiosks Page** (`src/pages/KiosksPage.tsx`):
  - Added live backend connectivity indicator: `<Badge variant="live">Live Backend Data • /api/admin/kiosks</Badge>`.
  - Fleet counters dynamically update based on deterministic online, offline, and maintenance states.
  - Modal view displays subsystem diagnostics: Device Health, Network Connectivity, Thermal Printer Status, and Knowledge Cache Sync.
  - Clear safety banner informs operators that remote shell commands and remote restarts are disabled.

---

## 5. Verification & Test Results

### 5.1 Kiosk Monitoring Test Suite (`test_admin_kiosks.py`) — 19/19 PASSED
```
======================================================================
RUNNING PHASE 2A.3 KIOSK FLEET MONITORING TEST SUITE
======================================================================
[PASSED] Test 01: Admin Can List Kiosks - Status: 200, Total: 4
[PASSED] Test 02: STAFF Isolation (Only Assigned PACS) - Count: 1, Leaks: 0
[PASSED] Test 03: ADMIN Global Fleet Visibility - Total visible kiosks: 4
[PASSED] Test 04: Single Kiosk Detail With Subsystem Health - Status: 200, Health: {'device': 'ok', 'network': 'online', 'printer': 'ready', 'sync': 'synced'}
[PASSED] Test 05: District Filter (Pune) - Matches: 1
[PASSED] Test 06: PACS Society Filter - Matches: 1
[PASSED] Test 07: Status Filter (online) - Online kiosks count: 2
[PASSED] Test 08: Free-Text Search (Baramati) - Matches: ['KSK-002']
[PASSED] Test 09: Maintenance Status Transition (PATCH) - Status: maintenance, Notes: Touchscreen alignment scheduled
[PASSED] Test 10: Unauthorized Access Rejected (401) - Status: 401
[PASSED] Test 11: Staff Forbidden For Other PACS (403) - Status: 403
[PASSED] Test 12: Unknown Kiosk Returns 404 - Status: 404
[PASSED] Test 13: M2M Heartbeat Ingestion (Valid Key) - Status: 200, State: maintenance
[PASSED] Test 14: M2M Heartbeat Rejected (Invalid Key) - Status: 401
[PASSED] Test 15: Heartbeat Updates last_heartbeat - Last Heartbeat: 2026-09-12T19:44:46.769031+00:00
[PASSED] Test 16: Heartbeat Updates Diagnostic Subsystems - Health: {'device': 'degraded', 'network': 'weak', 'printer': 'low_paper', 'sync': 'synced'}
[PASSED] Test 17: Heartbeat Cannot Modify Arbitrary Columns - Location preserved: Dindori Road, Nashik
[PASSED] Test 18: Remote Reboot Strictly Blocked / Non-Existent - Paths returned: 404, 404
[PASSED] Test 19: Citizen API Regression Immunity - Health status: {'status': 'ok', ...}
======================================================================
RESULTS: 19/19 TESTS PASSED
ALL KIOSK FLEET TESTS PASSED.
======================================================================
```

### 5.2 Full Platform Regression Suite — 100% PASSED
- **Admin Authentication (`test_admin_auth.py`)**: `12/12 PASSED`
- **Admin Grievance Triage (`test_admin_grievances.py`)**: `19/19 PASSED`
- **Citizen Core Architecture (`test_citizen_regression.py`)**: `6/6 PASSED`

### 5.3 Production Builds
- **Citizen Frontend (`/Users/pranav/SIH26088-Cooperative-AI/frontend`)**:
  - `npm run build`: **0 errors, built in 96ms**.
- **Admin Frontend (`/Users/pranav/Sarkar Setu Admin`)**:
  - `npm run build`: **0 errors, built in 126ms**.

---

## 6. Final Verdict

**PASS — KIOSK MONITORING VERIFIED**
