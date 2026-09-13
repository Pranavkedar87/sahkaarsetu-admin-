# SahkaarSetu Admin — Phase 2B.3 Governed Knowledge Publishing Implementation

## Executive Summary
Phase 2B.3 completes the governed knowledge publication lifecycle for the SahkaarSetu Operations Admin Portal:
```
DRAFT → UNDER_REVIEW → VERIFIED → ADMIN APPROVAL → PUBLISHED → LIVE RAG
```

This workflow enforces strict separation of privileges, multi-stage governance validation, text extraction, deterministic chunking, 768-dimensional Gemini embeddings (`gemini-embedding-001`), atomic database transitions, version lineage supersession, and clean rollback with zero database pollution on failure.

---

## 1. Core Architecture & Governance Gate

### Role-Based Access Control
- **ADMIN**: Authorized to triage (`review`), legally verify (`verify`), reject back to draft (`reject`), and publish (`publish` / `approve`).
- **STAFF**: Can upload documents and submit for review. Attempting to verify, reject, or publish strictly returns **HTTP 403 Forbidden**.
- **PUBLIC / UNAUTHENTICATED**: Strictly returns **HTTP 401 Unauthorized**.

### Distinct Lifecycle Endpoints
1. `POST /api/admin/knowledge/documents/{id}/review`: Transitions `draft` to `under_review`.
2. `POST /api/admin/knowledge/documents/{id}/verify`: Distinct ADMIN-only operation that audits and validates governance evidence:
   - Authority & Issuing Authority Level (Central/State/District)
   - Statutory Jurisdiction (e.g. `MAHARASHTRA`, `INDIA`)
   - Explicit Applicability (e.g. `["ALL_COOPERATIVES"]`, `["PACS"]`)
   - Precedence Tier (1-100)
   - Effective Date (YYYY-MM-DD)
   - Sets `verification_status = 'VERIFIED_OFFICIAL'`, `currentness_status = 'CURRENT'`, and keeps `is_current = False` (retrieval inactive).
3. `POST /api/admin/knowledge/documents/{id}/reject`: ADMIN-only operation that transitions under-review or verified documents back to `draft`.
4. `POST /api/admin/knowledge/documents/{id}/publish` (and alias `.../approve`): Canonical ADMIN-only publication endpoint executing Stages A through K.

---

## 2. Staged Publication Pipeline (Stages A through K)

| Stage | Action | Description |
| :--- | :--- | :--- |
| **A** | **Governance Validation** | Validates status is `verified`, `verification_status = 'VERIFIED_OFFICIAL'`, `currentness_status = 'CURRENT'`. Validates all mandatory fields. |
| **B** | **Read Stored File** | Streams bytes from Supabase Storage / local repository cache. |
| **C** | **Extract Text** | Extracts structured text and page sections from PDF, Markdown, TXT, JSON, or CSV. |
| **D** | **Deterministic Chunking** | Splits text into chunks with 500-char max size and 50-char overlap via `rag.chunker.chunk_text`. |
| **E & F**| **Gemini Embeddings** | Calls `GeminiEmbeddingProvider.embed_text()` using `gemini-embedding-001`. Validates each vector is exactly 768 dimensions. |
| **G** | **Chunk Packaging** | Packages chunks with full metadata: `document_id`, `source_name`, `version`, `page_number`, `authority_level`, `jurisdiction`, `applicability`, `precedence_tier`, `status='published'`, `is_current=True`. |
| **H** | **Staging Insertion** | Idempotently cleans any existing chunks for this `document_id` and stages new chunks into `knowledge_chunks`. |
| **I** | **Integrity & Rollback** | If embedding or database insertion fails, all staged chunks are deleted, prior version remains intact, and document stays `verified` (HTTP 500). |
| **J** | **Atomic Activation** | Marks document `status='published'` and `is_current=True`. Automatically supersedes any older version of the document lineage (`status='superseded'`, `is_current=False`, `currentness_status='SUPERSEDED'`). |
| **K** | **Live RAG Invalidation** | Calls `reset_chunks_cache()` so the live citizen retrieval engine immediately recognizes the published chunks. |

---

## 3. Test Suite Verification (`test_admin_knowledge_publish.py`)

All 22 required test cases pass with 100% success:

1. `[PASSED] Test 01: ADMIN Can Verify Document in under_review (200 OK)`
2. `[PASSED] Test 02: STAFF Cannot Verify (403 Forbidden)`
3. `[PASSED] Test 03: ADMIN Can Publish Valid Verified Document (200 OK, chunks created)`
4. `[PASSED] Test 04: STAFF Cannot Publish (403 Forbidden)`
5. `[PASSED] Test 05: Draft Cannot Bypass Review to Verify/Publish (400 Bad Request)`
6. `[PASSED] Test 06: Under-Review Cannot Bypass Verification to Publish (400 Bad Request)`
7. `[PASSED] Test 07: Missing Governance Metadata Blocks Verification (400 Bad Request)`
8. `[PASSED] Test 08: Unverified Status Blocks Publication (400 Bad Request)`
9. `[PASSED] Test 09: Non-Current Status Blocks Publication (400 Bad Request)`
10. `[PASSED] Test 10: Invalid Authority/Jurisdiction Blocks Publication (400 Bad Request)`
11. `[PASSED] Test 11: Existing Published Document Remains Intact`
12. `[PASSED] Test 12: New Published Document Has Chunks in knowledge_chunks`
13. `[PASSED] Test 13: New Chunks Use 768-Dimensional Embeddings`
14. `[PASSED] Test 14: Embedding Model Remains gemini-embedding-001`
15. `[PASSED] Test 15: Source/Page/Version/Status Metadata Preserved on Chunks`
16. `[PASSED] Test 16: Published Document Retrievable in Live Citizen RAG (Rank #0)`
17. `[PASSED] Test 17: Verified But Unpublished Document NOT Retrievable in Live RAG`
18. `[PASSED] Test 18: Failed Embedding Leaves Document Unpublished and Clean (Rollback)`
19. `[PASSED] Test 19: Repeated Publish Is Idempotent (No Duplicate Chunks)`
20. `[PASSED] Test 20: Previous Version Superseded and Chunks Marked Non-Current`
21. `[PASSED] Test 21: Unauthorized Request Rejected (401 Unauthorized)`
22. `[PASSED] Test 22: Citizen /api/query Remains Functional`

**Corpus Integrity**: Baseline chunk count was exactly 29 chunks. Final chunk count after test teardown was exactly 29 chunks. Zero database pollution.

---

## 4. Frontend Implementation

In `Sarkar Setu Admin`:
- `src/services/api/knowledge.ts`: Added client methods `verifyKnowledgeDocument()`, `publishKnowledgeDocument()`, `rejectKnowledgeDocument()`.
- `src/pages/KnowledgePage.tsx`:
  - Added Legal Verification Modal with input fields for issuing authority level, jurisdiction, applicability tags, statutory effective date, and precedence tier.
  - Added Publish Confirmation Modal featuring staged embedding progress indicators and warning alerts.
  - Role-aware UX: When logged in as `ADMIN`, action buttons ("Verify Evidence", "Approve & Publish", "Return to Draft") are active; when logged in as `STAFF`, status badges are displayed with publishing actions cleanly disabled.
  - Vite production build tested and verified with 0 TypeScript/compilation errors.
