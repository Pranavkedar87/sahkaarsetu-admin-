# SahkaarSetu Admin — Phase 2B.2 Ingestion & Review Workflow Documentation

## Executive Summary

Phase 2B.2 implements the Admin-side Knowledge Document Ingestion & Administrative Review Workflow for the SahkaarSetu Cooperative AI Platform:

$$\text{UPLOAD} \longrightarrow \text{METADATA} \longrightarrow \text{DRAFT} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \text{ADMIN REVIEW}$$

This workflow provides a secure, governed entry point for state cooperative circulars, model by-laws, government schemes, and PACS guidelines.

---

## 🔒 Safety & Governance Non-Negotiables

1. **Citizen RAG Isolation**:
   Newly uploaded documents enter the system strictly with `status = 'draft'`, `is_current = False`, `verification_status = 'NEEDS_VERIFICATION'`, and `currentness_status = 'NEEDS_VERIFICATION'`.
   The live citizen RAG retriever (`rag/retriever.py`) enforces:
   
   $$\text{Retrievable} \iff (\text{status} = \text{'published'}) \land (\text{is\_current} = \text{True})$$
   
   Because drafts fail both conditions, zero uploaded drafts can be accessed or returned by citizen query answering.

2. **Zero Vector Chunking / Embedding**:
   No text chunking or Gemini vector embedding occurs during document upload in Phase 2B.2. Exactly **0** rows are added to `knowledge_chunks`.

3. **Embedding Invariants**:
   - Model: `gemini-embedding-001`
   - Dimension: `768`
   - Generation: `gemini-2.5-flash`

4. **Premature Publication Block**:
   - `POST /api/admin/knowledge/documents/{id}/publish` $\longrightarrow$ **HTTP 400 Bad Request**
   - `POST /api/admin/knowledge/documents/{id}/approve` $\longrightarrow$ **HTTP 400 Bad Request**

5. **Citizen Frontend Preservation**:
   The Citizen Frontend project (`/Users/pranav/SIH26088-Cooperative-AI/frontend`) remains completely untouched.

---

## 🛠️ Architecture & Component Implementation

### 1. Storage Subsystem (`backend/database/storage.py`)
- **Bucket**: Private Supabase bucket `knowledge_documents` with local scratch fallback (`backend/scratch_storage/`).
- **Path structure**: `uploads/{document_id}/{sanitized_filename}`.
- **Content Validation**:
  - Max size limit: 25 MB (`MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024`).
  - Prohibited extensions: `.exe`, `.sh`, `.bat`, `.cmd`, `.py`, `.js`, `.php`, `.elf`.
  - Binary magic byte validation: PDF (`%PDF-`), UTF-8 text/markdown, valid JSON/CSV.
  - Filename sanitization via strict regex.

### 2. Admin Knowledge Router (`backend/app/api/routes/admin_knowledge.py`)
- `POST /api/admin/knowledge/documents`: Multipart file upload & metadata registration. Returns 201 Created with draft document metadata.
- `GET /api/admin/knowledge/documents`: List documents with title/source search, status filters, and pagination.
- `GET /api/admin/knowledge/documents/{id}`: Detailed document metadata and storage path information.
- `POST /api/admin/knowledge/documents/{id}/review`: Transition `draft` $\longrightarrow$ `under_review`.
- `GET /api/admin/knowledge/documents/{id}/file`: Stream raw uploaded binary file to authorized admin operators.
- `POST .../approve` & `POST .../publish`: Prohibited endpoints returning HTTP 400 Bad Request.

### 3. Admin Frontend Integration (`Sarkar Setu Admin`)
- **Type Definitions (`src/types/index.ts`)**: Added governance properties (`is_current`, `verificationStatus`, `currentnessStatus`, `authorityLevel`, `precedenceTier`, `fileName`, `fileSizeBytes`).
- **API Service (`src/services/api/knowledge.ts`)**: Implemented `getKnowledgeDocuments`, `uploadKnowledgeDocument`, `submitDocumentForReview`, `getDocumentDetails`.
- **Knowledge Page (`src/pages/KnowledgePage.tsx`)**:
  - File picker modal accepting `.pdf`, `.txt`, `.md`, `.json`, `.csv`.
  - Table row "Submit Review" action for draft documents.
  - Detailed governance modal displaying status, isolation banner, metadata, and raw file download button.
  - Explicit warning disclaimers stating that publishing & vector embedding are reserved for Phase 2B.3.

---

## 🧪 Comprehensive Test Suite Verification

The Phase 2B.2 test suite (`backend/scripts/test_admin_knowledge_upload.py`) verified 20 test cases:

| # | Test Case Description | Result |
|---|---|---|
| 01 | Admin can upload valid PDF document | PASSED |
| 02 | STAFF can upload valid PDF document | PASSED |
| 03 | Invalid file type rejected (`.exe`) | PASSED |
| 04 | Oversized file upload rejected (>25MB) | PASSED |
| 05 | Empty file rejected (0 bytes) | PASSED |
| 06 | Malicious filename / path traversal sanitized | PASSED |
| 07 | Newly uploaded document created as `draft` | PASSED |
| 08 | `is_current` is strictly `False` for new upload | PASSED |
| 09 | Conservative verification status applied (`NEEDS_VERIFICATION`) | PASSED |
| 10 | Zero `knowledge_chunks` created during upload | PASSED |
| 11 | Admin can list uploaded document | PASSED |
| 12 | Staff can list uploaded document | PASSED |
| 13 | Search query matches document title/source | PASSED |
| 14 | Status filtering returns `draft` / `under_review` appropriately | PASSED |
| 15 | Document detail endpoint returns full metadata & storage info | PASSED |
| 16 | Transition `draft` $\longrightarrow$ `under_review` succeeds | PASSED |
| 17 | Premature publish / approve endpoints strictly blocked | PASSED |
| 18 | Unauthorized request rejected (invalid token) | PASSED |
| 19 | Citizen RAG retrieval cannot return draft / under-review document | PASSED |
| 20 | Existing published corpus intact and active | PASSED |

```
======================================================================
RESULTS: 20/20 TESTS PASSED
ALL 20 PHASE 2B.2 KNOWLEDGE UPLOAD TESTS PASSED SUCCESSFULLY!
======================================================================
```

---

## 🟢 Conclusion

The Admin Knowledge Ingestion & Administrative Review Workflow is fully verified, safe, and active.

**PASS — KNOWLEDGE UPLOAD VERIFIED**
