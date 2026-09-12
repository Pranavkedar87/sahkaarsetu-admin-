# SahkaarSetu — Phase 2B Knowledge Management Architecture & Safety Audit

**Document:** `ADMIN_PHASE_2B_KNOWLEDGE_ARCHITECTURE_AUDIT.md`  
**Date:** September 13, 2026  
**Scope:** Architecture & Safety Audit Only (No code changes, No database changes, No re-indexing, No retriever modifications)  
**Projects Inspected:**
- Backend: `/Users/pranav/SIH26088-Cooperative-AI/backend`
- Citizen Frontend: `/Users/pranav/SIH26088-Cooperative-AI/frontend`
- Admin Frontend: `/Users/pranav/Sarkar Setu Admin`

---

## 1. Current Knowledge Architecture Audit

### 1.1 Existing Database Tables & Migrations
The knowledge architecture currently relies on two primary tables defined in `backend/database/schema.sql`:

1. **`knowledge_documents` Table**:
   ```sql
   CREATE TABLE IF NOT EXISTS knowledge_documents (
       id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
       title          TEXT        NOT NULL,
       description    TEXT,
       source_name    TEXT,
       source_url     TEXT,
       document_type  TEXT,
       language       TEXT,
       created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```
   - **Current State**: Contains 8 live records in Supabase.
   - **Critical Architectural Absence**: The table **has no `status` column**, **no `version` column**, **no `is_current` column**, and **no governance classification fields** (`authority_level`, `jurisdiction`, `applicability`, `verification_status`, `currentness_status`, `precedence_tier`).

2. **`knowledge_chunks` Table**:
   ```sql
   CREATE TABLE IF NOT EXISTS knowledge_chunks (
       id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
       document_id    UUID        NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
       content        TEXT        NOT NULL,
       chunk_index    INTEGER     NOT NULL,
       language       TEXT,
       metadata       JSONB,
       embedding      vector(768),
       created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```
   - **Current State**: Contains 29 vector chunks across the 8 documents.
   - **Embedding Dimensions**: Strictly `768` floats matching `gemini-embedding-001`.
   - **Chunk Metadata**: Currently stores only `{source_name, source_url, document_type, embedding}`. It **does not store page numbers, section numbers, or document status**.

3. **Database RPC Function (`match_knowledge_chunks`)**:
   ```sql
   CREATE OR REPLACE FUNCTION match_knowledge_chunks (
     query_embedding vector(768),
     match_threshold float DEFAULT 0.5,
     match_count int DEFAULT 5,
     filter_language text DEFAULT NULL,
     filter_intent text DEFAULT NULL
   )
   RETURNS TABLE (...)
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       kc.id, kc.document_id, kc.content, kc.chunk_index, kc.language,
       kc.metadata, (1 - (kc.embedding <=> query_embedding))::float AS similarity,
       kd.title, kd.source_name, kd.source_url, kd.document_type
     FROM knowledge_chunks kc
     JOIN knowledge_documents kd ON kc.document_id = kd.id
     WHERE kc.embedding IS NOT NULL
       AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
       AND (filter_language IS NULL OR kc.language = filter_language OR kc.language IS NULL)
     ORDER BY kc.embedding <=> query_embedding
     LIMIT match_count;
   END;
   $$;
   ```
   - **CRITICAL AUDIT FINDING**: `match_knowledge_chunks` joins `knowledge_documents` on `document_id` but **does not perform any status filtering**. If an unpublished, draft, or obsolete chunk exists in `knowledge_chunks`, the RPC returns it to the citizen query pipeline.

---

## 2. Current Governance Model Analysis

### 2.1 Governance Schema (`backend/app/schemas/governance.py`)
The system defines rich statutory governance taxonomy:
- **`DocumentType`**: `ACT`, `RULE`, `BYLAW`, `SCHEME`, `GUIDELINE`, `NOTIFICATION`, `MANUAL`, `FAQ`, `UNKNOWN`
- **`AuthorityLevel`**: `CENTRAL_GOVERNMENT`, `STATE_GOVERNMENT`, `NABARD`, `RBI`, `NCDC`, `RCS`, `DISTRICT_FEDERATION`, `COOPERATIVE_SOCIETY`, `UNKNOWN`
- **`Jurisdiction`**: `INDIA`, `MAHARASHTRA`, `GUJARAT`, `KARNATAKA`, `DELHI`, `UNKNOWN`
- **`Applicability`**: `ALL_COOPERATIVES`, `PACS`, `HOUSING`, `DAIRY`, `FISHERY`, `URBAN_BANK`, `RURAL_BANK`, `CREDIT`, `UNKNOWN`
- **`VerificationStatus`**: `VERIFIED_OFFICIAL`, `OFFICIAL_NEEDS_VERIFICATION`, `VERIFIED_EXPERT`, `REFERENCE_ONLY`, `NEEDS_VERIFICATION`
- **`CurrentnessStatus`**: `ACTIVE_IN_FORCE`, `AMENDED`, `SUPERSEDED`, `DRAFT`, `NEEDS_VERIFICATION`, `UNKNOWN`
- **`PrecedenceTier`**:
  - `TIER_1_STATUTORY_ACT` (Weight 100)
  - `TIER_2_STATUTORY_RULE` (Weight 90)
  - `TIER_3_APPLICABLE_BYLAW` (Weight 80)
  - `TIER_4_SCHEME_GUIDELINE` (Weight 70)
  - `TIER_5_MODEL_BYLAW_ADVISORY` (Weight 60)
  - `TIER_6_EDUCATIONAL_FAQ` (Weight 50)
  - `TIER_7_UNKNOWN` (Weight 10)

### 2.2 Storage Discrepancy: Database vs. Disk Cache
- **In Postgres Database**: Only basic descriptive fields (`title`, `description`, `source_name`, `source_url`, `document_type`, `language`) are persisted.
- **In File System (`knowledge_base/**/*.json`)**: Curated JSON files store `authority_level`, `jurisdiction`, `applicability`, `verification_status`, `currentness_status`, and `precedence_tier`.
- **In `retriever.py` (`_load_governance_metadata`)**: The backend dynamically scans disk files, caches metadata in `_METADATA_CACHE`, and matches chunks by document `title` at retrieval time.
- **Audit Conclusion**: Any document uploaded via future Admin APIs cannot rely on static disk JSON files. Governance metadata **must be added as first-class columns** in the `knowledge_documents` table and `knowledge_chunks.metadata` to ensure complete traceability.

---

## 3. Current Retrieval Safety & RAG Behavior

### 3.1 Retrieval Flow (`backend/rag/retriever.py`)
Citizen queries pass through a 4-stage governed retrieval pipeline:
1. **Intent Pre-filtering**: Filters by target domain (`INTENT_ALLOWED_DOC_TYPES`). For example, queries about crop loans restrict legal acts and prefer PACS manuals.
2. **Dual-Tier Similarity Search**:
   - Primary: Supabase pgvector RPC `match_knowledge_chunks` (threshold 0.40–0.45).
   - Fallback A: In-memory vector cache cosine similarity search (`_get_cached_chunks`).
   - Fallback B: Grounded keyword matching (`LOCAL_KNOWLEDGE_DOCUMENTS`).
3. **Governance Enrichment**: Enriches raw chunks with `_enrich_chunk()` using cached governance metadata.
4. **Applicability Isolation & Ranking**:
   - `_is_applicability_allowed`: Enforces strict domain separation (e.g. housing documents are never returned for PACS queries, and vice versa).
   - `_governance_sort_key`: Ranks by `(applicability, jurisdiction, currentness, verification, -precedence_tier, -similarity)`.

### 3.2 Safety Vulnerabilities Identified
1. **Draft Document Leakage Risk**: Because `match_knowledge_chunks` and `_get_cached_chunks` query all records in `knowledge_chunks`, any chunk inserted before full admin approval is immediately retrievable.
2. **Superseded Version Collision**: If an amended act is ingested without purging or deactivating old chunks, both the old law and new amendment compete in vector retrieval, potentially causing Gemini 2.5 Flash to cite outdated statutory limits.
3. **No Database RLS Isolation**: `FastAPI` connects via the Supabase service-role key, bypassing PostgreSQL RLS entirely. Safety must be enforced programmatically and at the RPC query level.

---

## 4. Controlled Document Lifecycle Design

To eliminate duplicate terminology and establish strict operational gates, Phase 2B establishes the following unified lifecycle:

```
[ Upload PDF / Form ]
        │
        ▼
   ┌─────────┐
   │  DRAFT  │ ── (Text extracted, page preserved, draft metadata tagged)
   └─────────┘     [STRICTLY ISOLATED: No vectors in knowledge_chunks]
        │
        │ Staff / Admin Review
        ▼
┌──────────────┐
│ UNDER REVIEW │ ── (Under legal inspection, scope & applicability check)
└──────────────┘
        │
        │ Legal officer verification
        ▼
  ┌──────────┐
  │ VERIFIED │ ── (Source URL, mandate, authority verified; awaiting publish)
  └──────────┘
        │
        │ Authorized ADMIN ONLY (POST /approve)
        ▼
 ┌───────────┐
 │ PUBLISHED │ ── (Chunked, 768-dim Gemini embedded, loaded into knowledge_chunks)
 └───────────┘     [ACTIVE IN CITIZEN RAG]
        │
        ├────────────────────────────────┬───────────────────────────────┐
        │ Scheduled expiry date reached  │ Amended / Replaced            │ Revoked / Obsolete
        ▼                                ▼                               ▼
 ┌────────────┐                  ┌────────────┐                  ┌──────────┐
 │ REVIEW DUE │                  │ SUPERSEDED │                  │ OUTDATED │
 └────────────┘                  └────────────┘                  └──────────┘
 (Still published, flagged       (De-indexed from RAG;           (De-indexed;
  for officer review)             archived in audit lineage)      historical audit only)
```

### Lifecycle State Definitions:
1. **`Draft`**: Uploaded source document. Text extracted and metadata populated. Strictly isolated from `knowledge_chunks` and citizen RAG.
2. **`Under Review`**: Submitted for formal review. Accessible to Admin and Staff for inspection.
3. **`Verified`**: Statutory authority, applicability, jurisdiction, and official source URL validated by operational personnel. Not yet active in citizen retrieval.
4. **`Published`**: Explicitly authorized by an **ADMIN**. Triggers chunking, `gemini-embedding-001` vector generation (768-dim), and activation in `knowledge_chunks`. Participating in live citizen RAG.
5. **`Review Due`**: Document has reached its `expiry_review_date`. Retains published retrieval status to prevent knowledge vacuum, but displays priority alert on Admin dashboard.
6. **`Outdated`**: Document repealed, cancelled, or expired without replacement. Chunks are deactivated from live vector retrieval.
7. **`Superseded`**: Replaced by a newer version. Chunks are deactivated from live vector retrieval; document record retained for historical legal traceability.

---

## 5. Publish Safety & The Four-Layer Invariant

### Core Invariant
> **ABSOLUTE RULE:** ONLY documents with status `PUBLISHED` and `is_current = TRUE` may have retrievable vectors in `knowledge_chunks` or participate in citizen RAG retrieval.

### Enforcement Across All 4 Layers:

```
Layer 1: API Layer (FastAPI Route Guards)
 └─ Only POST /api/admin/knowledge/documents/{id}/approve (ADMIN role required) can trigger publication.
 └─ Validation rejects publication if source_url, authority, jurisdiction, or applicability are missing.

Layer 2: Database Layer (Postgres Constraints & Schema)
 └─ knowledge_documents.status CHECK (status IN ('draft','under_review','verified','published','review_due','outdated','superseded')).
 └─ knowledge_documents.is_current BOOLEAN DEFAULT false.
 └─ Trigger/Constraint guarantees only one version of a parent document has is_current = true.

Layer 3: Chunk / Indexing Layer (Zero Pre-Publication Embedding)
 └─ During Draft/Under Review/Verified states, NO records are inserted into knowledge_chunks.
 └─ Chunking and embedding occur ONLY during the atomic publish transition.
 └─ Alternatively, knowledge_chunks inherits status column, and status != 'published' is rejected.

Layer 4: Retriever & RPC Layer (Strict Query Filtering)
 └─ RPC match_knowledge_chunks updated: AND kd.status = 'published' AND kd.is_current = true.
 └─ Python memory cache _get_cached_chunks updated: WHERE status = 'published'.
```

---

## 6. Versioning Architecture

### 6.1 Version Lineage Model
Rather than a detached disjoint table, Phase 2B implements self-referential document lineage within `knowledge_documents`:
- `parent_document_id` (UUID nullable): Points to the original document root. For v1.0, `parent_document_id = NULL` (or points to self). For v2.0, `parent_document_id` points to v1.0.
- `version` (VARCHAR): Semantic version string (e.g. `v1.0`, `v1.1`, `v2.0`).
- `is_current` (BOOLEAN): Exactly one document in a lineage has `is_current = TRUE`.
- `superseded_by` (UUID nullable): References the replacing document.

### 6.2 Atomic Version Transition Protocol
When an amendment or new circular is published:
```
Step 1: Admin uploads new version as DRAFT (parent_document_id = old_doc.id, version = "v2.0").
Step 2: Legal inspection and verification occur in DRAFT / UNDER REVIEW / VERIFIED states.
Step 3: Admin issues POST /api/admin/knowledge/documents/{new_id}/approve.
Step 4: Atomic Database Transaction:
        a. Delete or flag inactive old chunks in knowledge_chunks where document_id = old_doc.id.
        b. Update old_doc: status = 'superseded', is_current = false, superseded_by = new_id.
        c. Update new_doc: status = 'published', is_current = true, published_at = now().
        d. Chunk new_doc text into 500-character segments with 80-character overlap.
        e. Generate 768-dim embeddings via gemini-embedding-001.
        f. Insert new chunks into knowledge_chunks.
        g. Invalidate in-memory _CHUNKS_CACHE.
```
**Outcome**: Zero downtime, zero duplicate chunks, and zero window where outdated laws conflict with current amendments.

---

## 7. Source Traceability Protocol

To prevent AI hallucinations and support judicial verification, every retrieved response must be traceable back to an authenticated primary source.

### Traceability Chain:
$$\text{Citizen Claim} \longrightarrow \text{Chunk Content} \longrightarrow \text{Document ID} \longrightarrow \text{Page \& Section} \longrightarrow \text{Source URL} \longrightarrow \text{Authority \& Tier}$$

### Chunk Metadata Preservation:
Every row in `knowledge_chunks` must persist structured metadata in `metadata` JSONB:
```json
{
  "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "version": "v2024.1",
  "page_number": "14",
  "section_number": "Section 73CB",
  "authority_level": "STATE_GOVERNMENT",
  "jurisdiction": "MAHARASHTRA",
  "applicability": ["ALL_COOPERATIVES"],
  "source_name": "Department of Co-operation, Govt of Maharashtra",
  "source_url": "https://cooperatives.maharashtra.gov.in/acts/mcs-1960",
  "verification_status": "VERIFIED_OFFICIAL",
  "precedence_tier": 100,
  "chunk_index": 3
}
```

### Context Formatting for Gemini:
`rag/pipeline.py` formats chunks for the LLM prompt with explicit citation headers:
```markdown
[DOCUMENT: Maharashtra Cooperative Societies Act 1960 (Amended 2024)]
[AUTHORITY: State Government | JURISDICTION: Maharashtra | TIER: Statutory Act (100)]
[CITATION: Section 73CB, Page 14 | URL: https://cooperatives.maharashtra.gov.in/acts/mcs-1960]
Content: "..."
```
The Gemini prompt strictly instructs: *"Only state legal rules present in the provided grounding text. Never invent circular numbers, dates, or source URLs."*

---

## 8. PDF Upload, Text Extraction & Page Preservation

### Safe Upload Architecture:
1. **File Type & Size Restrictions**:
   - Permitted MIME types: `application/pdf`, `text/plain`, `application/json`.
   - Maximum file size: `25 MB`.
   - File extensions: `.pdf`, `.txt`, `.json`.
2. **Sanitization & Storage**:
   - Filenames are never used directly on the filesystem (prevents path traversal and shell injections).
   - Files are stored with UUID keys: `uploads/knowledge/{document_id}.pdf`.
   - Persisted in Supabase Storage bucket (`knowledge-documents`) or secure local volume.
3. **Extraction & Page Tracking**:
   - Use `pypdf` or `pdfplumber` to extract text **page-by-page**.
   - Preserves page boundaries: `[{"page": 1, "text": "..."}, {"page": 2, "text": "..."}]`.
   - Chunker receives page-attributed blocks so each resulting chunk retains its `page_number`.
4. **Scanned PDF Handling (OCR Gate)**:
   - If total extracted text across a PDF is $< 100$ characters, the file is classified as a scanned image.
   - It is marked `status = 'draft'`, `extraction_status = 'ocr_required'`.
   - OCR processing is delegated to an asynchronous background worker (using Gemini Vision OCR or Tesseract) without blocking the admin API request.

---

## 9. Reindex Safety Protocol

Reindexing recalculates chunks and embeddings for an existing document (e.g. after fine-tuning chunk boundaries or fixing formatting).

### Safe Reindex Algorithm:
1. Verify document is in `published` status and caller has `ADMIN` role.
2. Read the canonical document text.
3. Generate new chunks using `rag/chunker.py`.
4. Generate new 768-dimensional embeddings using `GeminiEmbeddingProvider` (`gemini-embedding-001`).
5. **Atomic Swap**:
   - Begin database transaction.
   - Delete existing rows from `knowledge_chunks` where `document_id = target_id`.
   - Insert new chunks with updated indices and preserved metadata.
   - Update `knowledge_documents.updated_at = now()`.
   - Commit transaction.
6. Clear backend in-memory cache (`_CHUNKS_CACHE.clear()`).
7. **Failure Safety**: If Gemini embedding fails halfway through, the transaction is rolled back; the previous chunks remain untouched. No duplicate chunks or orphan vectors are created.

---

## 10. Database Gap Analysis & Migration Strategy

### A. Fields Already Sufficient
- `knowledge_documents`: `id`, `title`, `description`, `source_name`, `source_url`, `document_type`, `language`, `created_at`, `updated_at`.
- `knowledge_chunks`: `id`, `document_id`, `content`, `chunk_index`, `language`, `embedding` (vector 768), `created_at`.

### B. Missing Database Fields (To be added in Phase 2B migration)
On `knowledge_documents`:
- `status` VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'verified', 'published', 'review_due', 'outdated', 'superseded'))
- `version` VARCHAR(32) NOT NULL DEFAULT 'v1.0'
- `is_current` BOOLEAN NOT NULL DEFAULT false
- `parent_document_id` UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL
- `superseded_by` UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL
- `authority_level` VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN'
- `jurisdiction` VARCHAR(64) NOT NULL DEFAULT 'MAHARASHTRA'
- `applicability` JSONB NOT NULL DEFAULT '["ALL_COOPERATIVES"]'::jsonb
- `year` INTEGER
- `effective_date` DATE
- `expiry_review_date` DATE
- `verification_status` VARCHAR(64) NOT NULL DEFAULT 'NEEDS_VERIFICATION'
- `currentness_status` VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN'
- `precedence_tier` INTEGER NOT NULL DEFAULT 50
- `raw_file_url` TEXT
- `published_at` TIMESTAMPTZ
- `published_by` UUID REFERENCES users(id) ON DELETE SET NULL
- `review_notes` TEXT

On `knowledge_chunks`:
- `page_number` VARCHAR(32)
- `section_number` VARCHAR(128)

### C. Indexes Required
```sql
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_current ON knowledge_documents(is_current);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_parent ON knowledge_documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_jurisdiction ON knowledge_documents(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_chunk ON knowledge_chunks(document_id, chunk_index);
```

### D. RPC Function Update Required
Update `match_knowledge_chunks` to join on `knowledge_documents` and add:
```sql
AND kd.status = 'published'
AND kd.is_current = true
```

### E. Migration Ordering
1. Run additive DDL (`ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS ...`).
2. Backfill existing 8 documents: `UPDATE knowledge_documents SET status = 'published', is_current = true, published_at = now() WHERE status = 'draft'`.
3. Create indexes.
4. Replace `match_knowledge_chunks` RPC with status guard.

---

## 11. Proposed API Contract for Phase 2B

| Method | Endpoint | RBAC | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/knowledge/documents` | `ADMIN`, `STAFF` | List documents with pagination, filters (`status`, `type`, `jurisdiction`, `applicability`), search. |
| `POST` | `/api/admin/knowledge/documents` | `ADMIN`, `STAFF` (draft only) | Upload document (PDF/text) with governance metadata. Creates `Draft` record. |
| `GET` | `/api/admin/knowledge/documents/{id}` | `ADMIN`, `STAFF` | Retrieve detailed document metadata, audit trail, and chunk telemetry. |
| `GET` | `/api/admin/knowledge/documents/{id}/versions` | `ADMIN`, `STAFF` | Retrieve complete version lineage for the document. |
| `POST` | `/api/admin/knowledge/documents/{id}/approve` | `ADMIN` ONLY | Transition `Under Review` / `Verified` $\to$ `Published`. Triggers chunking & vector indexing. |
| `POST` | `/api/admin/knowledge/documents/{id}/reject` | `ADMIN` ONLY | Return document to `Draft` with mandatory rejection feedback notes. |
| `POST` | `/api/admin/knowledge/documents/{id}/reindex` | `ADMIN` ONLY | Atomic re-chunking and re-embedding of published document chunks. |

---

## 12. Role-Based Access Control (RBAC) Matrix

| Operational Capability | `ADMIN` Role | `STAFF` Role | Unauthenticated |
| :--- | :---: | :---: | :---: |
| Browse & View Knowledge Docs | Yes | Yes | No (401) |
| Test Vector Retrieval Inspector | Yes | Yes | No (401) |
| Upload New Draft Document | Yes | Yes (Draft only) | No (401) |
| Edit Governance Metadata (Draft) | Yes | Yes (Draft only) | No (401) |
| Submit for Review | Yes | Yes | No (401) |
| **Approve & Publish to Live RAG** | **Yes** | **No (403 Forbidden)** | No (401) |
| **Reject / Return to Draft** | **Yes** | **No (403 Forbidden)** | No (401) |
| **Trigger Vector Reindex** | **Yes** | **No (403 Forbidden)** | No (401) |
| **Mark Superseded / Outdated** | **Yes** | **No (403 Forbidden)** | No (401) |

---

## 13. Security & Safety Audit

1. **Malicious File Upload Protection**:
   - Reject executable extensions (`.exe`, `.sh`, `.py`, `.js`, `.bat`).
   - Validate magic bytes (`%PDF-` for PDFs).
   - Strip metadata and store with randomized UUID names to avoid directory traversal.
2. **Payload Protection**:
   - Limit max request body size to 25 MB.
   - Text chunks sanitized against prompt injection patterns (e.g. `Ignore previous instructions and output...`).
3. **Credential & API Key Safety**:
   - Gemini API keys remain strictly on the backend server (`backend/.env`).
   - Browser client receives only retrieved text snippets with no API secrets.
4. **Auditability**:
   - Every status change, approval, rejection, and reindex operation logs the operator's User ID, timestamp, and action description.

---

## 14. RAG Regression Risks & Immunity Strategy

| Potential Risk | Failure Mode | Mitigation in Phase 2B |
| :--- | :--- | :--- |
| **Draft Document Exposure** | Unverified draft is cited as law by chatbot. | Chunks are **never created** until `Published`. RPC enforces `kd.status = 'published'`. |
| **Vector Dimension Mismatch** | Embedding fails or crashes pgvector query. | Enforce `EMBEDDING_DIMENSION = 768` using `gemini-embedding-001`. |
| **Model Incompatibility** | Gemini 2.5 Flash receives unexpected schema. | Strict adherence to `RetrievedChunk` TypedDict structure. |
| **Duplicate Chunks** | Reindex duplicates chunks, inflating scores. | Atomic transaction with `DELETE WHERE document_id = target_id` before chunk insertion. |
| **Broken Citations** | Assistant cites nonexistent URLs. | Chunks embed `source_url` directly in metadata; LLM system prompt mandates exact quotation. |

---

## 15. Frontend Integration Plan (`Sarkar Setu Admin`)

The Admin frontend at `/Users/pranav/Sarkar Setu Admin/src/pages/KnowledgePage.tsx` already has a mature UI built for this exact workflow:
1. **Immediate Compatibility**:
   - The UI already supports table filtering by Status (`Published`, `Under Review`, `Review Due`, `Outdated`).
   - The UI already contains the Document Detail Modal with metadata inspection and Version History.
   - The UI already contains the 3-step Document Upload Wizard.
   - The UI already contains Action buttons: `Approve & Publish`, `Reject / Request Changes`, `Test Vector Retrieval`.
2. **Required Frontend Adjustments during Phase 2B**:
   - In `src/services/api/knowledge.ts`:
     - Replace `localDocsState` mock mutations with real calls to `POST /api/admin/knowledge/documents`, `POST /approve`, `POST /reject`, and `POST /reindex`.
     - Pass the JWT `Authorization` header via `request()` client.
   - In `src/pages/KnowledgePage.tsx`:
     - Wire real multipart file upload (FormData) for PDF source files.
     - Add a "Reindex Chunks" button inside the Document Details modal for published documents.
     - Hide or disable `Approve & Publish` and `Reject` buttons if `role !== 'ADMIN'`.

---

## 16. Comprehensive Test Plan for Phase 2B

When Phase 2B implementation begins, the following 18 automated tests must be executed in `backend/scripts/test_admin_knowledge.py`:
1. `GET /api/admin/knowledge/documents` returns 200 with list of documents.
2. `GET /api/admin/knowledge/documents?status=published` filters correctly.
3. `GET /api/admin/knowledge/documents?type=ACT` filters correctly.
4. `GET /api/admin/knowledge/documents/{id}` returns complete metadata and chunk statistics.
5. `POST /api/admin/knowledge/documents` creates new document in `draft` status.
6. Draft document has 0 chunks in `knowledge_chunks`.
7. Citizen `/api/query` CANNOT retrieve draft document content.
8. `POST /api/admin/knowledge/documents/{id}/approve` transitions to `published` (Admin only).
9. Chunks are generated and embedded into `knowledge_chunks` upon approval.
10. Citizen `/api/query` CAN now retrieve the newly published content.
11. `POST /approve` by `STAFF` role returns `HTTP 403 Forbidden`.
12. `POST /api/admin/knowledge/documents/{id}/reject` returns document to `draft` with feedback note.
13. `POST /reject` by `STAFF` role returns `HTTP 403 Forbidden`.
14. `POST /api/admin/knowledge/documents/{id}/reindex` safely replaces chunks without duplicates.
15. Uploading a new version supersedes the previous version (`is_current = false`).
16. Superseded version chunks are deactivated and no longer returned in citizen queries.
17. Unauthenticated requests return `HTTP 401 Unauthorized`.
18. Citizen regression test confirms existing RAG and Gemini 2.5 Flash query endpoints remain 100% operational.

---

## 17. Explicit Invariants That Must Never Be Violated

1. **Invariant 1**: No document shall enter citizen RAG retrieval unless its status is explicitly `published` and `is_current = true`.
2. **Invariant 2**: No upload shall be published automatically. All uploads must land in `draft` or `under_review`.
3. **Invariant 3**: Staff members shall never be granted publication, rejection, or reindexing authority.
4. **Invariant 4**: Vector dimensions for `knowledge_chunks` shall remain strictly `768` dimensions using `gemini-embedding-001`.
5. **Invariant 5**: Primary LLM for citizen answering shall remain `gemini-2.5-flash` with governed citations.
6. **Invariant 6**: Model By-laws shall never override statutory Acts in precedence ranking (`ACT` precedence 100 > `RULE` 90 > `BYLAW` 80 > `SCHEME` 70).
7. **Invariant 7**: Housing documents shall never be cited for PACS agricultural loan queries, and PACS documents shall never be cited for Housing society disputes.
8. **Invariant 8**: Reindexing must be idempotent and transactional—never generating duplicate chunks.

---

## 18. Audit Conclusion & Final Verdict

The current architecture has been thoroughly analyzed. The safety boundaries and database gaps have been mapped out in detail. The four-layer publish invariant and atomic versioning model provide complete protection against unauthorized document exposure and RAG regression.

The system is fully designed and ready to proceed to implementation upon user approval.

### FINAL VERDICT:
**PASS — READY FOR PHASE 2B IMPLEMENTATION**
