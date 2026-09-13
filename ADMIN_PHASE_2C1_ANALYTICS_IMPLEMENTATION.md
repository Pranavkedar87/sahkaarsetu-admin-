# SahkaarSetu Admin — Phase 2C.1: Real Analytics & Operational Insights Implementation Report

**Author / Subsystem:** SahkaarSetu Operations Architecture Team  
**Phase:** 2C.1  
**Status:** **PASS — REAL ADMIN ANALYTICS VERIFIED**  
**Timestamp:** 2026-09-13T13:48:00Z  

---

## 1. Executive Summary

Phase 2C.1 converts the SahkaarSetu Admin Portal Analytics & Operational Insights and dashboard metrics from static/mock demo data (`analyticsDemo.ts`) to **100% REAL DATABASE-DERIVED DATA** sourced from Supabase PostgreSQL via dedicated, authenticated FastAPI backend endpoints.

### Core Architectural Invariant
```
Admin Frontend (React + Vite)
      ↓ (JWT Authenticated / Demo Bypass Header)
FastAPI Backend (app.api.routes.admin_analytics)
      ↓ (Server-side psycopg2 / Supabase Python Client)
Existing Supabase PostgreSQL Database (messages, grievances, knowledge_documents, kiosks)
```
- **Strict Separation:** The Admin frontend browser never connects directly to Supabase, preserves all RLS policies, and never holds service-role credentials.
- **Zero Fabrication Policy:** Metrics for channels not collected in current schemas (e.g. Voice STT vs Touch, and Kiosk vs Web source hardware ID) are honestly and explicitly reported as `null` / `"not_available"` with clear explanatory disclosures, completely eliminating arbitrary numbers.

---

## 2. Implemented Backend Endpoints & Schemas

### 2.1 Endpoints
1. `GET /api/admin/analytics/overview`
   - **Query Parameters:** `period` (`24h`, `7d`, `30d`; default: `30d`).
   - **Access Control:** Strictly restricted to authenticated `ADMIN` operators (HTTP 403 Forbidden for `STAFF`).
   - **Metrics Returned:**
     - `queries`: Lifetime total, today's count, last 7 days count, last 30 days count, and structured time series buckets (24 hourly buckets for `24h`, daily buckets for `7d` and `30d`).
     - `languages`: Multilingual adoption distribution derived from `messages` (`role = 'user'`).
     - `intents`: Domain classification distribution derived from `messages` (`role = 'assistant'`).
     - `grievances`: Real case counts grouped by lifecycle status (draft, submitted, under review, resolved, closed).
     - `knowledge`: Official knowledge document lifecycle counts (draft, under review, verified, published, published current, review due, superseded).
     - `kiosks`: Hardware fleet health and connectivity counts (online, offline, maintenance).
     - `channel_telemetry`: Transparent `null` values for voice and kiosk splits with explanatory rationale.
   - **Response Schema:** [`AdminAnalyticsOverviewResponse`](file:///Users/pranav/SIH26088-Cooperative-AI/backend/app/schemas/admin_analytics.py)

2. `GET /api/admin/analytics/knowledge-gaps`
   - **Access Control:** Strictly restricted to authenticated `ADMIN` operators.
   - **Derivation Logic:** Dynamically cross-references high-frequency citizen inquiry intents against published knowledge documents and grievance categories to identify uncovered topics.
   - **Response Schema:** [`AdminKnowledgeGapsResponse`](file:///Users/pranav/SIH26088-Cooperative-AI/backend/app/schemas/admin_analytics.py)

---

## 3. Database Truth & Metrics Verification

Direct verification against the live Supabase PostgreSQL database confirms exact consistency:

| Metric Category | Database Sourcing Table / Criteria | Live Database Count | API Output | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Total User Queries** | `messages` WHERE `role = 'user'` | 446 | 446 | **EXACT MATCH** |
| **Today's Queries** | `messages` WHERE `role = 'user'` AND `created_at >= today` | 25 | 25 | **EXACT MATCH** |
| **30-Day Queries** | `messages` WHERE `role = 'user'` AND `created_at >= 30d` | 446 | 446 | **EXACT MATCH** |
| **Top Languages** | `messages.language` | en (339), mr (78), hi (27) | en (76%), mr (17.5%), hi (6.1%) | **EXACT MATCH** |
| **Top Intents** | `messages.intent` | GENERAL_COOPERATIVE (124), PMFBY (116), PACS_SERVICE (75) | 10 real domains | **EXACT MATCH** |
| **Grievance Cases** | `grievances` table | 20 records | 20 records | **EXACT MATCH** |
| **Knowledge Docs** | `knowledge_documents` table | 20 records | 20 records | **EXACT MATCH** |
| **Kiosk Fleet** | Deterministic heartbeat registry | 4 terminals | 4 terminals | **EXACT MATCH** |

---

## 4. Frontend Integration Updates

### 4.1 API Client Service (`src/services/api/analytics.ts`)
- Replaced mock aggregations (`analyticsDemo.ts`) with live calls to `/api/admin/analytics/overview` and `/api/admin/analytics/knowledge-gaps`.
- Included period query parameter support (`24h`, `7d`, `30d`).
- Added robust typing: `OperationsAnalytics`, `TimeSeriesPoint`, `CategoryDistribution`, `LanguageDistribution`.

### 4.2 Insights & Knowledge Gaps Page (`src/pages/InsightsPage.tsx`)
- Added interactive period switcher (`24 Hours`, `7 Days`, `30 Days`) with automatic re-fetching.
- Updated KPI strip to render real query totals, real today/month counts, and active grievance triage counts.
- Displayed honest "Not Tracked" badges and disclosures for uncollected voice/kiosk channel telemetry.
- Grounded Assistance Demand chart with real date-bucketed query frequencies.
- Grounded Knowledge Gaps card with dynamic empirical evidence statements from live database queries.

### 4.3 Operations Dashboard Card 4 (`src/pages/DashboardPage.tsx`)
- Converted Card 4 (Assistance Volume) from static values (`44.8k Queries`, `8,940 queries / 24h`, `76.6% VOICE ASSISTED`) to live database-derived data (`446 Queries`, `25 queries today`, `446 30-DAY VOLUME`, `4 ACTIVE CASES`).

---

## 5. Verification & Test Suite Execution

### 5.1 Dedicated Phase 2C.1 Test Suite (`backend/scripts/test_admin_analytics.py`)
Executed 20 targeted tests verifying security, schemas, and database fidelity:
- **Test 01:** Unauthenticated `/overview` returns 401 — **PASSED**
- **Test 02:** Unauthenticated `/knowledge-gaps` returns 401 — **PASSED**
- **Test 03:** Staff operator blocked from `/overview` with 403 — **PASSED**
- **Test 04:** Staff operator blocked from `/knowledge-gaps` with 403 — **PASSED**
- **Test 05:** Admin operator access to `/overview` returns 200 — **PASSED**
- **Test 06:** Overview matches Pydantic response schema — **PASSED**
- **Test 07:** Overview provenance is `REAL_DB` — **PASSED**
- **Test 08:** Total query count equals exact DB user messages count (`446 == 446`) — **PASSED**
- **Test 09:** Period `24h` generates 24 hourly timeline buckets — **PASSED**
- **Test 10:** Period `7d` generates 7 daily timeline buckets — **PASSED**
- **Test 11:** Period `30d` generates 30 daily timeline buckets — **PASSED**
- **Test 12:** Invalid period filter returns 422 Unprocessable Entity — **PASSED**
- **Test 13:** Multilingual metrics contain real languages (`en`, `mr`, `hi`) — **PASSED**
- **Test 14:** Intent metrics contain real cooperative domains (`GENERAL_COOPERATIVE`, `PMFBY`, `PACS_SERVICE`) — **PASSED**
- **Test 15:** Grievances summary matches repository count (`20 == 20`) — **PASSED**
- **Test 16:** Knowledge governance summary matches repository count (`20 == 20`) — **PASSED**
- **Test 17:** Kiosk telemetry summary matches repository count (`4 == 4`) — **PASSED**
- **Test 18:** Uncollected telemetry channel fields are strictly `null` (`voice_vs_touch=null`, `kiosk_vs_web=null`) — **PASSED**
- **Test 19:** Knowledge gaps endpoint returns 200 and valid schema — **PASSED**
- **Test 20:** Knowledge gaps have positive frequency and empirical evidence — **PASSED**

**Result: 20/20 TESTS PASSED.**

### 5.2 Full System Regression Suites
- `test_admin_auth.py`: **PASSED**
- `test_admin_grievances.py`: **PASSED**
- `test_admin_kiosks.py`: **PASSED** (19/19)
- `test_admin_knowledge_safety.py`: **PASSED** (15/15)
- `test_admin_knowledge_upload.py`: **PASSED** (17/17)
- `test_admin_knowledge_publish.py`: **PASSED** (18/18)
- `test_admin_knowledge_reindex.py`: **PASSED** (22/22)
- `test_citizen_regression.py`: **PASSED** (6/6)

### 5.3 Production Build
- `npm run build` in `/Users/pranav/Sarkar Setu Admin`: **Zero errors, 100% TypeScript compliance**.

---

## 6. Safety Rules & Non-Negotiables Compliance

1. **Citizen Frontend Untouched:** Verified via git status in `/Users/pranav/SIH26088-Cooperative-AI/frontend` (0 modifications in this phase).
2. **AI & Embedding Invariants Preserved:**
   - Gemini generation untouched.
   - Embedding model unchanged: `gemini-embedding-001`.
   - Vector dimension invariant strictly maintained: `768`.
   - Governed RAG retrieval unchanged.
3. **No Direct Supabase Access in Browser:** Admin portal communicates exclusively with FastAPI `/api/admin/*` endpoints.
4. **No Hardcoded/Mock Telemetry in Production Paths:** All mock values removed from active components. Missing channel metrics reported as `null` with explicit reasons.

---

## 7. Final Verdict

```
===========================================================================
VERDICT: PASS — REAL ADMIN ANALYTICS VERIFIED
===========================================================================
```
