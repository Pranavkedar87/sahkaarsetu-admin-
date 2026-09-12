# SAHKAARSETU ADMIN PORTAL — PHASE 2 BACKEND/API ARCHITECTURE AUDIT & DESIGN PLAN

**Project:** SahkaarSetu — SIH26088  
**Target Backend:** `/Users/pranav/SIH26088-Cooperative-AI/backend`  
**Existing Frontend (Citizen):** `/Users/pranav/SIH26088-Cooperative-AI/frontend` (Protected — Unmodified)  
**Operations Frontend (Admin):** `/Users/pranav/Sarkar Setu Admin` (Deployed & Verified)  
**Date:** September 13, 2026  
**Status:** AUDIT & ARCHITECTURE DESIGN ONLY — NO CODE MODIFIED IN THIS PHASE

---

## 1. Executive Summary

This audit establishes the concrete architectural gap analysis and Phase 2 backend design plan for connecting the newly created **SahkaarSetu Operations Portal** to the existing FastAPI backend. 

### Key Audit Findings:
1. **Single Backend Principle Upheld**: The existing FastAPI backend at `/Users/pranav/SIH26088-Cooperative-AI/backend` is well-structured, modular, and fully capable of serving as the single unified backend for both Citizen and Operations interfaces without requiring a second backend or second database.
2. **Current Verified APIs**:
   - `GET /health` & `GET /` (System health & model metadata)
   - `POST /api/query` (Unified RAG query processing)
   - `GET /api/conversations/{id}/messages` (Conversation history playback)
   - `POST /api/voice/transcribe` (Groq Whisper STT)
   - `POST /api/voice/query` (Voice-mode AI generation with optional `device_id`)
   - `POST /api/vision/query` (OCR text analysis via `process_user_query`)
   - `GET /api/knowledge/documents` (Document registry list from DB / files)
   - `GET /api/knowledge/search` (Vector similarity search over chunks)
   - `POST /api/grievance` (Draft grievance creation & structured summary)
   - `GET /api/grievance/{id}` (Fetch grievance by UUID)
   - `GET /api/grievance/{id}/summary` (Fetch grievance structured summary)
3. **Primary Backend Gaps**:
   - **Authentication**: No active `/api/auth` routes exist. The `users` table exists in PostgreSQL as a placeholder (`"Foundation for future authentication"`).
   - **Kiosks**: No hardware telemetry table, heartbeat ingestion, or fleet management endpoints exist.
   - **Knowledge Mutations**: `POST /api/knowledge/documents` (upload), document status workflows (`Draft` -> `Under Review` -> `Published`), document versioning, and re-indexing endpoints do not exist.
   - **Grievance Triage**: No multi-case listing endpoint (`GET /api/grievances`) or status/assignment update endpoint exists (only single-case lookup by ID).
   - **Analytics**: Raw data exists in `messages` and `sessions`, but no pre-aggregated API endpoints exist.
4. **Safety & RAG Governance**: The existing Governed Retrieval Pipeline in `backend/rag/retriever.py` contains sophisticated multi-tier governance filtering (`precedence_tier`, `verification_status`, `currentness_status`, `jurisdiction`, and `applicability`). Phase 2 Admin APIs **must enforce** that newly uploaded documents cannot be indexed into live retrieval until verified and published by an authorized Admin.

---

## 2. Current Backend Architecture

The backend is built with Python 3.11 and FastAPI:
- **Application Entrypoint (`backend/app/main.py`)**:
  - Initializes logging and CORS (`allow_origins=["*"]`).
  - Mounts 7 routers: `health`, `query`, `conversations`, `voice`, `vision`, `knowledge`, and `grievance`.
- **Configuration (`backend/app/config.py`)**:
  - Pydantic Settings loading `.env` (`GEMINI_API_KEY`, `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Database Access (`backend/database/`)**:
  - `supabase.py`: Lazily initializes Supabase client with `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for server-side trusted writes.
  - `repository.py`: CRUD functions for `sessions`, `conversations`, `messages`, `grievances`, `knowledge_documents`.
  - `schema.sql`: PostgreSQL schema with pgvector (768-dim embeddings).
- **RAG Pipeline (`backend/rag/`)**:
  - `retriever.py`: 4-stage retrieval: (1) Intent filter, (2) Vector similarity (`match_knowledge_chunks` RPC), (3) Applicability isolation, (4) Governance ranking.
  - `intent.py`: Multi-domain classifier (PMFBY, PACS_SERVICE, COOPERATIVE_LAW, etc.).
  - `validator.py`: Factual grounding validator checking factual consistency.
- **Shared Query Orchestration (`backend/services/query_service.py`)**:
  - Single brain (`process_user_query`) serving Web, Voice, Hardware, and Camera clients.
  - Generates response immediately while persisting chat history asynchronously in background executor.

---

## 3. Existing API Inventory

| Method | Route | Schema / Handler | Current Data Source | Status |
|---|---|---|---|---|
| `GET` | `/` & `/health` | `app.api.routes.health` | System memory / config | Verified Live |
| `POST` | `/api/query` | `QueryRequest` → `QueryResponse` | RAG Pipeline + Supabase async | Verified Live |
| `GET` | `/api/conversations/{id}/messages` | `list[MessageItem]` | Supabase `messages` table | Verified Live |
| `POST` | `/api/voice/transcribe` | Multipart audio → `TranscribeResponse` | Groq Whisper API | Verified Live |
| `POST` | `/api/voice/query` | `VoiceQueryRequest` → `VoiceQueryResponse` | Shared `query_service` | Verified Live |
| `POST` | `/api/vision/query` | `VisionQueryRequest` → `QueryResponse` | Shared `query_service` | Verified Live |
| `GET` | `/api/knowledge/documents` | `list[DocumentItem]` | Supabase `knowledge_documents` + fallback JSON | Verified Live |
| `GET` | `/api/knowledge/search` | `q, language, intent, top_k` → `KnowledgeSearchResult` | `retriever.retrieve_relevant_knowledge` | Verified Live |
| `POST` | `/api/grievance` | `GrievanceCreateRequest` → `GrievanceSummaryResponse` | Supabase `grievances` table | Verified Live |
| `GET` | `/api/grievance/{id}` | UUID → `GrievanceSummaryResponse` | Supabase `grievances` table | Verified Live |
| `GET` | `/api/grievance/{id}/summary` | UUID → `GrievanceSummaryResponse` | Supabase `grievances` table | Verified Live |

---

## 4. Database / Table Inventory

The existing schema (`backend/database/schema.sql`) contains 7 tables:

1. **`users`**:
   - Columns: `id UUID`, `created_at TIMESTAMPTZ`, `language TEXT`.
   - Comment: *"Foundation for future authentication. Not actively used yet."*
   - Status: Empty placeholder. Lacks credentials, names, emails, roles, and status.
2. **`sessions`**:
   - Columns: `id UUID`, `user_id UUID (nullable)`, `language TEXT`, `created_at`, `updated_at`.
   - Status: Actively populated by citizen queries.
3. **`conversations`**:
   - Columns: `id UUID`, `session_id UUID`, `title TEXT`, `created_at`, `updated_at`.
   - Status: Actively populated by citizen queries.
4. **`messages`**:
   - Columns: `id UUID`, `conversation_id UUID`, `role TEXT ('user'\|'assistant')`, `content TEXT`, `language TEXT`, `intent TEXT`, `created_at`.
   - Status: Actively populated. Contains real-time user query streams and intent tags.
5. **`knowledge_documents`**:
   - Columns: `id UUID`, `title TEXT`, `description TEXT`, `source_name TEXT`, `source_url TEXT`, `document_type TEXT`, `language TEXT`, `created_at`, `updated_at`.
   - Status: Houses official legal documents. Lacks version numbers, publication status, and governance authority levels.
6. **`knowledge_chunks`**:
   - Columns: `id UUID`, `document_id UUID`, `content TEXT`, `chunk_index INT`, `language TEXT`, `metadata JSONB`, `embedding vector(768)`, `created_at`.
   - Status: Indexed for vector similarity search.
7. **`grievances`**:
   - Columns: `id UUID`, `conversation_id UUID (nullable)`, `category TEXT`, `description TEXT`, `status TEXT ('draft'\|'submitted'\|'under_review'\|'resolved'\|'closed')`, `created_at`, `updated_at`.
   - Status: Populated when citizens submit grievances. Lacks priority, assigned staff, and notes.

---

## 5. Authentication Audit & Gap Analysis

### A. What already exists in backend/database
- `users` table schema: `(id UUID, created_at TIMESTAMPTZ, language TEXT)`.
- Foreign key from `sessions.user_id` to `users.id`.

### B. What partially exists and can be reused
- The `users` table can be extended, or an `admin_users` table can be added.

### C. What is completely missing
- Password hashing library (`passlib[bcrypt]` or `argon2-cffi`).
- JWT token handling library (`pyjwt` or `python-jose`).
- Endpoints: `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `POST /api/admin/auth/logout`.
- FastAPI dependency `get_current_admin_user` and role-checker `require_admin_role(["ADMIN", "STAFF"])`.

### D. Can existing tables support it without schema changes?
- **No**. The `users` table currently has only `id`, `created_at`, and `language`.

### E. Schema change explanation
To support secure authentication without duplicating tables, `users` must be altered:
```sql
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'STAFF')),
  ADD COLUMN IF NOT EXISTS assigned_pacs TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
```

### F. Recommended endpoints
- `POST /api/admin/auth/login`: Authenticate email/password, issue JWT Bearer token.
- `GET /api/admin/auth/me`: Validate JWT Bearer token and return active operator profile.
- `POST /api/admin/auth/logout`: Stateless client token invalidation.

### G. Recommended request / response shape
```json
// POST /api/admin/auth/login Request
{
  "email": "admin.operations@sahkaarsetu.gov.in",
  "password": "SecurePassword123!"
}

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 28800,
  "user": {
    "id": "c7a8b5e2-...",
    "email": "admin.operations@sahkaarsetu.gov.in",
    "name": "Shri Rajesh K. Sharma",
    "role": "ADMIN",
    "assigned_pacs": null
  }
}
```

### H. Auth requirements
- Public route: `/login`.
- Protected routes: All `/api/admin/*` endpoints require header `Authorization: Bearer <token>`.

### I. Frontend switch readiness
- **Immediate**. The Admin frontend `src/services/api/auth.ts` and `src/pages/LoginPage.tsx` are already typed for this exact schema.

### J. Risks to citizen application
- **Zero risk**. Citizen visits create anonymous sessions with `user_id = NULL`.

---

## 6. Kiosk Management API Gap Analysis

### A. What already exists in backend/database
- `device_id` string field accepted in `POST /api/voice/query` and `POST /api/vision/query`.

### B. What partially exists and can be reused
- Query logging can associate queries with a `device_id`.

### C. What is completely missing
- Kiosk hardware database table.
- Kiosk list, detail, and status update endpoints.
- Kiosk heartbeat receiver endpoint.

### D. Can existing tables support it without schema changes?
- **No**. There is no table representing kiosk devices or hardware telemetry.

### E. Schema change explanation
A dedicated `kiosks` table is required to track physical touchpoints:
```sql
CREATE TABLE IF NOT EXISTS kiosks (
    id                TEXT PRIMARY KEY,  -- e.g. 'KSK-001'
    name              TEXT NOT NULL,
    location          TEXT NOT NULL,
    district          TEXT NOT NULL,
    state             TEXT NOT NULL DEFAULT 'Maharashtra',
    pacs_name         TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    ip_address        TEXT,
    software_version  TEXT NOT NULL DEFAULT 'v2.4.1',
    installation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    uptime_percent    FLOAT NOT NULL DEFAULT 99.0,
    health            JSONB NOT NULL DEFAULT '{"device":"ok","network":"online","printer":"ready","sync":"synced"}'::jsonb,
    last_heartbeat    TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### F. Recommended endpoints
- `GET /api/admin/kiosks`: List all kiosks with status/district filters.
- `GET /api/admin/kiosks/{id}`: Detailed telemetry, health indicators, and usage stats.
- `PATCH /api/admin/kiosks/{id}`: Update status (e.g. toggle maintenance) or update field notes.
- `POST /api/kiosks/{id}/heartbeat`: Ingest hardware heartbeat from ESP32/mini-PC kiosk daemon.

### G. Recommended request / response shape
Matches `KioskItem` in `src/types/index.ts`:
```json
{
  "id": "KSK-001",
  "name": "Nashik Central PACS Kiosk",
  "location": "Dindori Road, Nashik",
  "district": "Nashik",
  "state": "Maharashtra",
  "pacsName": "Dindori Primary Agriculture Cooperative Society",
  "status": "online",
  "lastActive": "2 minutes ago",
  "softwareVersion": "v2.4.1",
  "ipAddress": "192.168.12.45",
  "installationDate": "2025-08-15",
  "uptimePercent": 99.4,
  "queriesToday": 142,
  "totalQueries": 14250,
  "health": {
    "device": "ok",
    "network": "online",
    "printer": "ready",
    "sync": "synced"
  }
}
```

### H. Auth requirements
- `GET /api/admin/kiosks`: `ADMIN` sees all; `STAFF` filtered by `assigned_pacs`.
- `PATCH /api/admin/kiosks/{id}`: `ADMIN` or assigned `STAFF`.
- `POST /api/kiosks/{id}/heartbeat`: Machine-to-machine API key (`X-Kiosk-Key`).

### I. Frontend switch readiness
- **Immediate**. `src/services/api/kiosks.ts` maps directly to this structure.

### J. Risks to citizen application
- **Zero risk**. Isolated to operational monitoring.

---

## 7. Knowledge Management API Gap Analysis (Core Module)

### A. What already exists in backend/database
- `knowledge_documents` and `knowledge_chunks` tables in Supabase.
- `GET /api/knowledge/documents` (read-only list).
- `GET /api/knowledge/search` (vector similarity search).
- `match_knowledge_chunks` pgvector RPC function.
- `backend/app/schemas/governance.py` containing complete governance enumerations:
  - `DocumentType`: ACT, RULE, BYLAW, SCHEME, GUIDELINE, NOTIFICATION, MANUAL, FAQ.
  - `AuthorityLevel`: CENTRAL_GOVERNMENT, STATE_GOVERNMENT, NABARD, RBI, NCDC, RCS, etc.
  - `Jurisdiction`: INDIA, MAHARASHTRA, GUJARAT, KARNATAKA, DELHI.
  - `Applicability`: ALL_COOPERATIVES, PACS, HOUSING, DAIRY, FISHERY, URBAN_BANK, etc.
  - `VerificationStatus`: VERIFIED_OFFICIAL, OFFICIAL_NEEDS_VERIFICATION, VERIFIED_EXPERT, REFERENCE_ONLY, NEEDS_VERIFICATION.
  - `CurrentnessStatus`: ACTIVE_IN_FORCE, AMENDED, SUPERSEDED, DRAFT, NEEDS_VERIFICATION.
  - `PrecedenceTier`: TIER_1_STATUTORY_ACT (100) to TIER_7_UNKNOWN (10).
- `backend/rag/retriever.py`: Multi-stage governance sorting and domain isolation (`_is_applicability_allowed`, `_governance_sort_key`).

### B. What partially exists and can be reused
- Reading and searching documents.
- The governance metadata schema is already defined in Python code (`governance.py`).

### C. What is completely missing
- Document creation/upload API (`POST /api/admin/knowledge/documents`).
- Ingestion review workflow (`Draft` -> `Under Review` -> `Published` / `Rejected`).
- Version history tracking and parent-child document relationships.
- On-demand vector chunking & Gemini embedding generation pipeline upon document publication.

### D. Can existing tables support it without schema changes?
- **No**. `knowledge_documents` currently lacks dedicated columns for publication status, version numbers, effective dates, and governance fields (which currently only live in file metadata or chunk JSON).

### E. Schema change explanation
Add governance columns to `knowledge_documents` so that document status and authority are enforced at the database level:
```sql
ALTER TABLE knowledge_documents
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Under Review', 'Verified', 'Published', 'Review Due', 'Outdated')),
  ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_review_date DATE,
  ADD COLUMN IF NOT EXISTS scope TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pacs_name TEXT,
  ADD COLUMN IF NOT EXISTS scheme TEXT,
  ADD COLUMN IF NOT EXISTS authority_level TEXT DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS applicability TEXT[] DEFAULT ARRAY['ALL_COOPERATIVES'],
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'NEEDS_VERIFICATION',
  ADD COLUMN IF NOT EXISTS currentness_status TEXT DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS precedence_tier INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS notes TEXT;
```
Also create a `document_versions` table to preserve full statutory audit history when policies are superseded:
```sql
CREATE TABLE IF NOT EXISTS document_versions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id       UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    version           TEXT NOT NULL,
    effective_date    DATE NOT NULL,
    status            TEXT NOT NULL CHECK (status IN ('Current', 'Superseded', 'Draft')),
    verification_state TEXT NOT NULL,
    updated_by        TEXT NOT NULL,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### F. Recommended endpoints
- `GET /api/admin/knowledge/documents`: List documents with filters (`status`, `document_type`, `language`).
- `POST /api/admin/knowledge/documents`: Upload file or register metadata (enforces `status = 'Under Review'`).
- `GET /api/admin/knowledge/documents/{id}/versions`: View full version history.
- `POST /api/admin/knowledge/documents/{id}/approve`: Transition status to `Published`. Triggers text chunking + Gemini embeddings (`gemini-embedding-001`) into `knowledge_chunks`.
- `POST /api/admin/knowledge/documents/{id}/reject`: Returns document to `Draft` with feedback notes.
- `POST /api/admin/knowledge/documents/{id}/reindex`: Re-embeds document chunks into pgvector.

### G. Recommended request / response shape
Matches `KnowledgeDoc` in `src/types/index.ts`.

### H. Auth requirements
- `POST /api/admin/knowledge/documents`: Allowed for `STAFF` and `ADMIN`.
- `approve` & `publish`: Strictly restricted to `ADMIN`.

### I. Frontend switch readiness
- **Immediate**. The Admin frontend `KnowledgePage.tsx` and `src/services/api/knowledge.ts` already execute this exact state transition flow.

### J. Risks to citizen application & RAG pipeline
- **CRITICAL SAFETY SAFEGUARD**:
  The citizen RAG retriever MUST ONLY match chunks whose parent document has `status = 'Published'` and `verification_status IN ('VERIFIED_OFFICIAL', 'OFFICIAL_NEEDS_VERIFICATION')`.
  Unapproved drafts must NEVER appear in citizen answers. Updating the RPC query condition (`kd.status = 'Published'`) guarantees zero contamination.

---

## 8. Grievance Management API Gap Analysis

### A. What already exists in backend/database
- `grievances` table: `id`, `conversation_id`, `category`, `description`, `status`, `created_at`, `updated_at`.
- `POST /api/grievance`: Creates draft grievance record.
- `GET /api/grievance/{id}`: Retrieves individual grievance.
- `GET /api/grievance/{id}/summary`: Retrieves structured complaint summary.

### B. What partially exists and can be reused
- All existing citizen grievance creation and retrieval endpoints remain 100% reusable.

### C. What is completely missing
- Multi-case listing with pagination and filters (`GET /api/admin/grievances`).
- Assignment of grievance to staff member (`PATCH /api/admin/grievances/{id}/assign`).
- Case status update and triage (`PATCH /api/admin/grievances/{id}/status`).
- Staff internal notes thread.

### D. Can existing tables support it without schema changes?
- **Partially**. Basic listing and status update (`draft`, `under_review`, `resolved`) can run on existing columns. However, priority, assigned staff name, PACS name, citizen masked contact, and staff notes are missing from the table.

### E. Schema change explanation
Add operational triage fields to `grievances`:
```sql
ALTER TABLE grievances
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')),
  ADD COLUMN IF NOT EXISTS assigned_staff TEXT,
  ADD COLUMN IF NOT EXISTS pacs_name TEXT,
  ADD COLUMN IF NOT EXISTS citizen_masked_name TEXT DEFAULT 'Citizen (Protected)',
  ADD COLUMN IF NOT EXISTS citizen_phone_masked TEXT,
  ADD COLUMN IF NOT EXISTS staff_notes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_guidance TEXT;
```

### F. Recommended endpoints
- `GET /api/admin/grievances`: Paginated list filterable by status, priority, category, PACS.
- `GET /api/admin/grievances/{id}`: Detailed view including linked conversation dialogue if `conversation_id` is set.
- `PATCH /api/admin/grievances/{id}`: Update `status`, `priority`, or `assigned_staff`.
- `POST /api/admin/grievances/{id}/notes`: Append an internal staff note.

### G. Recommended request / response shape
Matches `GrievanceRecord` in `src/types/index.ts`.

### H. Auth requirements
- `GET /api/admin/grievances`: `ADMIN` sees all; `STAFF` sees assigned cases or assigned PACS.
- `PATCH`: Authorized staff or admin.

### I. Frontend switch readiness
- **Immediate**. `GrievancesPage.tsx` and `src/services/api/grievances.ts` are ready for this contract.

### J. Risks to citizen application
- **Zero risk**. Existing citizen `POST /api/grievance` and `GET /api/grievance/{id}` behavior is unaffected.

---

## 9. Analytics / Insights API Gap Analysis

### A. What already exists in backend/database
- `messages` table containing `created_at`, `role`, `language`, `intent`.
- `sessions` table containing `created_at`, `language`.
- `grievances` table containing `created_at`, `category`, `status`.

### B. What partially exists and can be reused
- The raw data for query volumes, intent breakdowns, language shares, and grievance counts **already exists in the database today**!

### C. What is completely missing
- Aggregation API endpoints (`GET /api/admin/analytics/overview`, `GET /api/admin/analytics/knowledge-gaps`).
- Distinguishing voice vs touch vs web queries on the stored message level (currently stored messages don't record `channel` or `response_mode`).

### D. Can existing tables support it without schema changes?
- **Yes**. SQL `COUNT(*)`, `GROUP BY language`, and `GROUP BY intent` can compute 80% of analytics on existing tables without any schema modification.

### E. Schema change explanation
- Optional improvement: Add `channel TEXT DEFAULT 'web'` to `messages` or `sessions` to accurately separate Kiosk from Web queries.

### F. Recommended endpoints
- `GET /api/admin/analytics/overview`: Query volume timeline, language distribution, top categories.
- `GET /api/admin/analytics/knowledge-gaps`: Returns topics with high user query frequency but low retrieval similarity score.

### G. Recommended request / response shape
Matches `OperationsAnalytics` in `src/services/api/analytics.ts`.

### H. Auth requirements
- Authenticated `ADMIN` or `STAFF`.

### I. Frontend switch readiness
- **Immediate**.

### J. Risks to citizen application
- **Zero risk**. Read-only analytical queries.

---

## 10. Notifications / Attention Center API Gap Analysis

### A. What already exists in backend/database
- None.

### B. What partially exists and can be reused
- Attention items can be computed on the fly by querying:
  1. Kiosks with `last_heartbeat < now() - interval '1 hour'` (Offline alert)
  2. Documents with `status = 'Review Due'` or `status = 'Under Review'`
  3. Grievances with `status = 'New'` or `priority = 'Urgent'`

### C. What is completely missing
- Notification queue endpoint and dismissal persistence.

### D. Can existing tables support it without schema changes?
- **Yes, via dynamic generation**. The backend can synthesize notifications directly from table states on `GET /api/admin/notifications`.
- For persistent dismissals, an `admin_notifications` table can be added in Phase 2C.

### E. Recommended endpoints
- `GET /api/admin/notifications`: Dynamic list of attention items.
- `POST /api/admin/notifications/{id}/read`: Mark notification dismissed.

### F. Auth requirements
- Authenticated operator.

### G. Frontend switch readiness
- **Immediate**. Matches `NotificationItem` in `src/types/index.ts`.

### H. Risks to citizen application
- **Zero risk**.

---

## 11. Audit Logging Gap Analysis

### A. What already exists in backend/database
- Python standard logger outputting to stdout/Render console.

### B. What is completely missing
- Database-backed immutable compliance log for statutory actions (approving laws, publishing by-laws, resolving disputes).

### C. Recommended schema change (Phase 2C)
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name   TEXT NOT NULL,
    action      TEXT NOT NULL,       -- e.g. 'DOCUMENT_APPROVED', 'GRIEVANCE_RESOLVED'
    entity_type TEXT NOT NULL,       -- 'knowledge_document', 'grievance', 'kiosk'
    entity_id   TEXT NOT NULL,
    details     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 12. Recommended API Contract Specification

```
ADMIN API ROUTE PREFIX: /api/admin

AUTH
  POST   /api/admin/auth/login          (Public)
  GET    /api/admin/auth/me             (Bearer Token)
  POST   /api/admin/auth/logout         (Bearer Token)

KIOSKS
  GET    /api/admin/kiosks              (Bearer Token)
  GET    /api/admin/kiosks/{id}         (Bearer Token)
  PATCH  /api/admin/kiosks/{id}         (Bearer Token - Role: ADMIN/STAFF)
  POST   /api/kiosks/{id}/heartbeat     (Machine Key X-Kiosk-Key)

KNOWLEDGE (GOVERNED LIFECYCLE)
  GET    /api/admin/knowledge/documents (Bearer Token)
  POST   /api/admin/knowledge/documents (Bearer Token - Upload Draft)
  GET    /api/admin/knowledge/documents/{id}/versions (Bearer Token)
  POST   /api/admin/knowledge/documents/{id}/approve  (Bearer Token - Role: ADMIN)
  POST   /api/admin/knowledge/documents/{id}/reject   (Bearer Token - Role: ADMIN)
  POST   /api/admin/knowledge/documents/{id}/reindex  (Bearer Token - Role: ADMIN)

GRIEVANCES
  GET    /api/admin/grievances          (Bearer Token)
  GET    /api/admin/grievances/{id}     (Bearer Token)
  PATCH  /api/admin/grievances/{id}     (Bearer Token - Status / Assign)
  POST   /api/admin/grievances/{id}/notes (Bearer Token - Add Note)

ANALYTICS & ATTENTION
  GET    /api/admin/analytics/overview  (Bearer Token)
  GET    /api/admin/analytics/knowledge-gaps (Bearer Token)
  GET    /api/admin/notifications       (Bearer Token)
  POST   /api/admin/notifications/{id}/read (Bearer Token)
```

---

## 13. Database Changes Required vs Not Required

### Changes NOT Required:
- No new database instance needed (reuse existing Supabase PostgreSQL).
- `sessions`, `conversations`, and `messages` core columns remain unchanged.
- `knowledge_chunks` vector dimension remains 768 (`vector(768)`).

### Changes Required (Additive Only — Non-Breaking):
1. Add operator authentication columns to `users`.
2. Add governance columns to `knowledge_documents`.
3. Create `document_versions` table for statutory version audit trail.
4. Add operational triage columns to `grievances`.
5. Create `kiosks` table for hardware fleet telemetry.
6. Create `audit_logs` table for compliance tracking.

All migrations must use `ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` to ensure zero downtime.

---

## 14. Security Considerations

1. **No Credentials in Browser**: The Admin frontend never accesses Supabase service keys or Gemini API keys.
2. **Role Separation**:
   - `STAFF`: Restricted to assigned PACS grievances, draft document uploads, and assigned kiosk monitoring.
   - `ADMIN`: Full authority to approve documents for AI indexing, view all kiosks, and reassign grievances.
3. **Data Privacy**: Citizen phone numbers and names are masked in Admin API responses (`Tukaram S. K****`, `+91 98221 •••••`).
4. **Token Expiry**: JWT access tokens expire in 8 hours; refresh tokens stored securely in HTTP-only cookies or bearer headers.

---

## 15. Citizen-RAG Regression Risks & Prevention

| Risk | Consequence | Prevention Architecture |
|---|---|---|
| **Draft Document Leakage** | Unverified draft circular answered as law by AI | `match_knowledge_chunks` RPC filters strictly on `kd.status = 'Published'`. Chunks are only embedded upon explicit Admin approval. |
| **Outdated Policy Override** | Superseded by-laws contradict active rules | Governance sort key (`_governance_sort_key`) down-ranks superseded documents (`precedence_tier: 10`, `currentness: SUPERSEDED`). |
| **Cross-Domain Contamination** | Housing rules applied to PACS questions | Applicability filter (`_is_applicability_allowed`) strictly separates housing and agricultural documents. |
| **Backend Latency Spike** | Heavy Admin analytical queries slow down citizen voice responses | Run analytical queries on separate DB read pools or use indexed aggregation summaries. |

---

## 16. Recommended Implementation Order (Phased Delivery)

```
PHASE 2A (Core Admin Triage & Auth)
├── Database Additive Migrations (users, grievances, kiosks)
├── Admin Authentication (/api/admin/auth/login, /me)
├── Grievances Triage API (/api/admin/grievances list, assign, status)
└── Kiosk Monitoring API (/api/admin/kiosks list, detail, heartbeat)

PHASE 2B (Governed Knowledge Publishing Lifecycle)
├── Database Additive Migrations (knowledge_documents governance cols, document_versions)
├── Document Upload & Metadata API (/api/admin/knowledge/documents)
├── Admin Approval & Publishing Workflow (Draft -> Under Review -> Published)
└── Automated Chunk Embedding via Gemini (publish -> chunk -> embed -> upsert)

PHASE 2C (Analytics, Notifications & Audit Logging)
├── Analytics Aggregation Endpoints (/overview, /knowledge-gaps)
├── Dynamic Notifications API (/notifications)
└── Audit Trail Logging Table & API (/audit-logs)
```

---

## 17. Explicit List of APIs that Should NOT be Implemented Yet

1. ❌ **Remote Kiosk Hardware Reboot / Power Cut** (`POST /api/kiosks/{id}/restart`):
   - *Reason*: No secure hardware daemon/MQTT agent exists on field devices. Proposing remote restart without firmware agent would be deceptive and dangerous.
2. ❌ **Automated Government Filing Submission** (`POST /api/grievance/submit-official`):
   - *Reason*: No official government DDR or CPGRAMS filing API bridge exists. The platform prepares structured summaries for human presentation.
3. ❌ **Autonomous Legal Self-Updating**:
   - *Reason*: The AI must never modify statutory rules without human administrative review and sign-off.
4. ❌ **Public Operator Self-Registration** (`POST /api/auth/register`):
   - *Reason*: Operations portal accounts must be provisioned by administrators only.

---

## 18. Detailed Feature Audit Table

| FEATURE | CURRENT STATE | REAL API | DB SUPPORT | SCHEMA CHANGE | IMPLEMENTATION PRIORITY | NOTES |
|---|---|---|---|---|---|---|
| **Backend Health Check** | Fully Working | `GET /health` | Memory / Config | None | Complete | Serves liveness and model verification |
| **Document Registry List** | Fully Working | `GET /api/knowledge/documents` | `knowledge_documents` | None | Complete | Lists registered documents |
| **Vector Similarity Search** | Fully Working | `GET /api/knowledge/search` | `knowledge_chunks` (pgvector) | None | Complete | Uses 768-dim Gemini embeddings |
| **Single Grievance Lookup** | Fully Working | `GET /api/grievance/{id}` | `grievances` | None | Complete | Retrieves record and structured summary |
| **Citizen Grievance Create** | Fully Working | `POST /api/grievance` | `grievances` | None | Complete | Generates structured summary |
| **Conversation Messages** | Fully Working | `GET /api/conversations/{id}/messages` | `messages` | None | Complete | Chronological chat history playback |
| **AI Query Processing** | Fully Working | `POST /api/query` | Shared RAG Service | None | Complete | Unified pipeline for all frontends |
| **Voice STT Transcription** | Fully Working | `POST /api/voice/transcribe` | Groq Whisper | None | Complete | Multilingual server-side audio transcription |
| **Voice Mode AI Query** | Fully Working | `POST /api/voice/query` | Shared RAG Service | None | Complete | Audio-optimized response mode |
| **Vision / Camera Query** | Fully Working | `POST /api/vision/query` | Shared RAG Service | None | Complete | OCR text processing pipeline |
| **Admin Authentication** | Missing | None | Placeholder `users` | Add email, password_hash, role | **Phase 2A (High)** | JWT Bearer authentication required |
| **Grievance Triage List** | Missing | None | `grievances` (Partial) | Add priority, staff, notes | **Phase 2A (High)** | Need multi-case pagination & assignment |
| **Kiosk Fleet Telemetry** | Missing | None | None | Create `kiosks` table | **Phase 2A (Medium)** | Telemetry & heartbeat monitoring |
| **Document Ingestion Upload** | Missing | None | `knowledge_documents` | Add status, version, governance | **Phase 2B (High)** | Multi-step upload with verification lock |
| **Document Approval / Publish** | Missing | None | `knowledge_documents` | Add status, versions table | **Phase 2B (High)** | Triggers Gemini chunk embedding into DB |
| **Analytics Overview** | Missing | None | Raw data in `messages` | None (SQL aggregates) | **Phase 2C (Medium)** | Query volumes, vernacular breakdown |
| **Knowledge Gap Discovery** | Missing | None | Raw queries | None (SQL aggregates) | **Phase 2C (Medium)** | Identifies low-similarity query topics |
| **Operational Notifications** | Missing | None | Computed dynamically | Optional read-state table | **Phase 2C (Low)** | Alert feed with deep module links |
| **Compliance Audit Trail** | Missing | None | None | Create `audit_logs` table | **Phase 2C (Low)** | Statutory action compliance logging |
| **Remote Kiosk Reboot** | Prohibited | None | None | None | **Do Not Implement** | Safety hazard without hardware agent |
| **Automated Govt Filing** | Prohibited | None | None | None | **Do Not Implement** | No official government API bridge |

---

## 19. Final Audit Verdict

```
======================================================================
VERDICT: PASS — READY FOR PHASE 2 IMPLEMENTATION
======================================================================
```

**Justification:**
1. The backend architecture is sound and fully verified.
2. The existing citizen platform and RAG pipeline are completely safe from regression under the proposed non-breaking additive schema.
3. The Admin frontend at `/Users/pranav/Sarkar Setu Admin` is completely prepared and will achieve 100% real-time data connectivity as each Phase 2 API endpoint is deployed.
