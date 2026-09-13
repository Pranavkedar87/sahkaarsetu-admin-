import { request } from './client';
import { KnowledgeDoc, DocumentType, DocumentStatus } from '../../types';
import { DEMO_KNOWLEDGE_DOCS } from '../../data/demo';

export interface AdminDocBackendItem {
  id: string;
  title: string;
  description?: string;
  source_name?: string;
  source_url?: string;
  document_type: string;
  language: string;
  status: string;
  version: string;
  is_current: boolean;
  authority_level?: string;
  jurisdiction?: string;
  applicability?: string[];
  year?: number;
  effective_date?: string;
  expiry_review_date?: string;
  verification_status: string;
  currentness_status: string;
  precedence_tier: number;
  raw_file_url?: string;
  storage_path?: string;
  file_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  review_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminKnowledgeListBackendResponse {
  items: AdminDocBackendItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ChunkSearchItem {
  content: string;
  document_id: string;
  title: string;
  source_name?: string;
  source_url?: string;
  document_type?: string;
  language?: string;
  similarity: number;
}

export interface KnowledgeSearchResult {
  query: string;
  language: string;
  chunks: ChunkSearchItem[];
  count: number;
  isRealBackend: boolean;
}

function mapBackendStatusToFrontend(backendStatus: string): DocumentStatus {
  const s = (backendStatus || '').toLowerCase().trim();
  if (s === 'draft') return 'Draft';
  if (s === 'under_review') return 'Under Review';
  if (s === 'verified') return 'Verified';
  if (s === 'published') return 'Published';
  if (s === 'review_due') return 'Review Due';
  if (s === 'outdated' || s === 'superseded') return 'Outdated';
  return 'Draft';
}

function mapBackendTypeToFrontend(docType: string): DocumentType {
  const dt = (docType || '').toLowerCase().trim();
  if (dt.includes('law') || dt.includes('act')) return 'Cooperative Law';
  if (dt.includes('bylaw') || dt.includes('by-law')) return 'By-laws';
  if (dt.includes('scheme')) return 'Government Scheme';
  if (dt.includes('circular')) return 'Circular';
  if (dt.includes('pacs')) return 'PACS Document';
  if (dt.includes('pmfby') || dt.includes('agri')) return 'PMFBY / Agriculture';
  if (dt.includes('finan')) return 'Financial Literacy';
  if (dt.includes('guide')) return 'Guidelines';
  return 'Other Official Document';
}

export function mapAdminDocToFrontend(bDoc: AdminDocBackendItem): KnowledgeDoc {
  const status = mapBackendStatusToFrontend(bDoc.status);
  const docType = mapBackendTypeToFrontend(bDoc.document_type);
  const appStr = Array.isArray(bDoc.applicability) ? bDoc.applicability.join(', ') : 'All Cooperatives';

  return {
    id: bDoc.id,
    title: bDoc.title,
    description: bDoc.description || 'Registered in official backend knowledge repository',
    sourceName: bDoc.source_name || 'Government Authority',
    sourceUrl: bDoc.source_url || undefined,
    documentType: docType,
    scope: bDoc.jurisdiction ? `${bDoc.jurisdiction} Jurisdiction` : 'State Authority',
    state: bDoc.jurisdiction === 'MAHARASHTRA' ? 'Maharashtra' : undefined,
    language: bDoc.language || 'en',
    version: bDoc.version || 'v1.0',
    effectiveDate: bDoc.effective_date || bDoc.created_at?.split('T')[0] || '2026-01-01',
    expiryReviewDate: bDoc.expiry_review_date || undefined,
    applicability: appStr,
    status: status,
    lastUpdated: bDoc.updated_at ? bDoc.updated_at.split('T')[0] : 'Recently',
    isRealBackend: true,
    notes: bDoc.review_notes || undefined,
    is_current: bDoc.is_current,
    verificationStatus: bDoc.verification_status,
    currentnessStatus: bDoc.currentness_status,
    authorityLevel: bDoc.authority_level,
    jurisdiction: bDoc.jurisdiction,
    precedenceTier: bDoc.precedence_tier,
    rawFileUrl: bDoc.raw_file_url,
    fileName: bDoc.file_name,
    fileSizeBytes: bDoc.file_size_bytes,
    reviewNotes: bDoc.review_notes,
    versions: [
      {
        version: bDoc.version || 'v1.0',
        effectiveDate: bDoc.effective_date || '2026-01-01',
        status: bDoc.is_current ? 'Current' : 'Draft',
        verificationState: bDoc.verification_status || 'Needs Verification',
        updatedBy: 'Operations Authority',
        notes: bDoc.review_notes || 'Initial document registration in repository.',
      },
    ],
  };
}

// In-memory fallback if backend is offline
let localDocsState: KnowledgeDoc[] = [...DEMO_KNOWLEDGE_DOCS];

export async function getKnowledgeDocuments(): Promise<{
  docs: KnowledgeDoc[];
  isRealBackend: boolean;
  sourceLabel: string;
}> {
  // First try the real admin knowledge endpoint
  const res = await request<AdminKnowledgeListBackendResponse>('/api/admin/knowledge/documents?page_size=100');

  if (res.isRealBackend && res.data && Array.isArray(res.data.items)) {
    const realDocs: KnowledgeDoc[] = res.data.items.map(mapAdminDocToFrontend);
    return {
      docs: realDocs,
      isRealBackend: true,
      sourceLabel: `Live Backend Data (${realDocs.length} documents registered)`,
    };
  }

  // Fallback to demo documents
  return {
    docs: localDocsState,
    isRealBackend: false,
    sourceLabel: 'Demonstration Knowledge Base (Backend API standby)',
  };
}

export async function uploadKnowledgeDocument(formData: FormData): Promise<{
  success: boolean;
  doc?: KnowledgeDoc;
  error?: string;
}> {
  const res = await request<AdminDocBackendItem>('/api/admin/knowledge/documents', {
    method: 'POST',
    body: formData,
  });

  if (res.data && res.data.id) {
    const doc = mapAdminDocToFrontend(res.data);
    // Also cache in local state for seamless immediate feedback
    localDocsState = [doc, ...localDocsState.filter((d) => d.id !== doc.id)];
    return { success: true, doc };
  }

  return {
    success: false,
    error: res.error || 'Failed to upload document to operations backend.',
  };
}

export async function submitDocumentForReview(
  docId: string,
  notes?: string
): Promise<{
  success: boolean;
  doc?: KnowledgeDoc;
  error?: string;
}> {
  const res = await request<{
    status: string;
    message: string;
    document: AdminDocBackendItem;
  }>(`/api/admin/knowledge/documents/${docId}/review`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

  if (res.data && res.data.document) {
    const doc = mapAdminDocToFrontend(res.data.document);
    localDocsState = localDocsState.map((d) => (d.id === doc.id ? doc : d));
    return { success: true, doc };
  }

  return {
    success: false,
    error: res.error || 'Failed to submit document for review.',
  };
}

export interface VerifyPayload {
  verification_notes?: string;
  authority_level?: string;
  jurisdiction?: string;
  applicability?: string[];
  effective_date?: string;
  expiry_review_date?: string;
  precedence_tier?: number;
}

export async function verifyKnowledgeDocument(
  docId: string,
  payload?: VerifyPayload
): Promise<{
  success: boolean;
  doc?: KnowledgeDoc;
  error?: string;
}> {
  const res = await request<{
    status: string;
    message: string;
    document: AdminDocBackendItem;
  }>(`/api/admin/knowledge/documents/${docId}/verify`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });

  if (res.data && res.data.document) {
    const doc = mapAdminDocToFrontend(res.data.document);
    localDocsState = localDocsState.map((d) => (d.id === doc.id ? doc : d));
    return { success: true, doc };
  }

  return {
    success: false,
    error: res.error || 'Failed to verify knowledge document.',
  };
}

export async function publishKnowledgeDocument(
  docId: string,
  notes?: string
): Promise<{
  success: boolean;
  doc?: KnowledgeDoc;
  chunksCount?: number;
  error?: string;
}> {
  const res = await request<{
    status: string;
    message: string;
    published_chunks_count: number;
    embedding_model: string;
    vector_dimension: number;
    document: AdminDocBackendItem;
  }>(`/api/admin/knowledge/documents/${docId}/publish`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });

  if (res.data && res.data.document) {
    const doc = mapAdminDocToFrontend(res.data.document);
    localDocsState = localDocsState.map((d) => (d.id === doc.id ? doc : d));
    return {
      success: true,
      doc,
      chunksCount: res.data.published_chunks_count,
    };
  }

  return {
    success: false,
    error: res.error || 'Failed to publish document to live RAG.',
  };
}

export async function rejectKnowledgeDocument(
  docId: string,
  reason?: string
): Promise<{
  success: boolean;
  doc?: KnowledgeDoc;
  error?: string;
}> {
  const res = await request<{
    status: string;
    message: string;
    document: AdminDocBackendItem;
  }>(`/api/admin/knowledge/documents/${docId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ notes: reason }),
  });

  if (res.data && res.data.document) {
    const doc = mapAdminDocToFrontend(res.data.document);
    localDocsState = localDocsState.map((d) => (d.id === doc.id ? doc : d));
    return { success: true, doc };
  }

  return {
    success: false,
    error: res.error || 'Failed to return document to draft.',
  };
}

export async function getDocumentDetails(docId: string): Promise<KnowledgeDoc | null> {
  const res = await request<AdminDocBackendItem>(`/api/admin/knowledge/documents/${docId}`);
  if (res.data && res.data.id) {
    return mapAdminDocToFrontend(res.data);
  }
  return null;
}

export interface DocumentVersionBackendItem {
  id: string;
  document_id: string;
  version: string;
  status: string;
  is_current: boolean;
  effective_date?: string;
  verification_status?: string;
  currentness_status?: string;
  published_at?: string;
  reviewed_at?: string;
  superseded_by?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  published_by?: string;
  chunks_count?: number;
}

export interface DocumentVersionHistoryBackendResponse {
  status: string;
  document_id: string;
  lineage_title: string;
  current_version?: string;
  total_versions: number;
  versions: DocumentVersionBackendItem[];
}

export interface ReindexBackendResponse {
  status: string;
  message: string;
  document_id: string;
  version: string;
  document_status: string;
  is_current: boolean;
  chunks_created: number;
  embedding_model: string;
  embedding_dimension: number;
  reindexed_at: string;
}

export async function getDocumentVersions(docId: string): Promise<{
  success: boolean;
  history?: DocumentVersionHistoryBackendResponse;
  error?: string;
}> {
  const res = await request<DocumentVersionHistoryBackendResponse>(`/api/admin/knowledge/documents/${docId}/versions`);
  if (res.data && Array.isArray(res.data.versions)) {
    return { success: true, history: res.data };
  }
  return {
    success: false,
    error: res.error || 'Failed to fetch document version history.',
  };
}

export async function reindexKnowledgeDocument(
  docId: string,
  notes?: string
): Promise<{
  success: boolean;
  result?: ReindexBackendResponse;
  error?: string;
}> {
  const res = await request<ReindexBackendResponse>(`/api/admin/knowledge/documents/${docId}/reindex`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  if (res.data && res.data.document_id) {
    return { success: true, result: res.data };
  }
  return {
    success: false,
    error: res.error || 'Failed to re-index knowledge document.',
  };
}

export async function searchKnowledgeChunks(
  query: string,
  language: string = 'en',
  topK: number = 4
): Promise<KnowledgeSearchResult> {
  const res = await request<{
    query: string;
    language: string;
    chunks: ChunkSearchItem[];
    count: number;
  }>(`/api/knowledge/search?q=${encodeURIComponent(query)}&language=${language}&top_k=${topK}`);

  if (res.isRealBackend && res.data && Array.isArray(res.data.chunks)) {
    return {
      ...res.data,
      isRealBackend: true,
    };
  }

  return {
    query,
    language,
    chunks: [
      {
        content: `Search query "${query}" executed. Real vector search returns chunks from published, current corpus.`,
        document_id: 'INFO-01',
        title: 'Governed Knowledge Index',
        similarity: 0.85,
      },
    ],
    count: 1,
    isRealBackend: false,
  };
}

