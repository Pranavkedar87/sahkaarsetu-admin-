import { request } from './client';
import { KnowledgeDoc, DocumentType, DocumentStatus } from '../../types';
import { DEMO_KNOWLEDGE_DOCS } from '../../data/demo';

interface BackendDocItem {
  id?: string;
  title: string;
  description?: string;
  source_name?: string;
  source_url?: string;
  document_type?: string;
  language?: string;
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

// In-memory document state to allow local demonstration of Upload, Approval, Reject, and Versioning
let localDocsState: KnowledgeDoc[] = [...DEMO_KNOWLEDGE_DOCS];

export async function getKnowledgeDocuments(): Promise<{
  docs: KnowledgeDoc[];
  isRealBackend: boolean;
  sourceLabel: string;
}> {
  const res = await request<BackendDocItem[]>('/api/knowledge/documents');

  if (res.isRealBackend && res.data && Array.isArray(res.data) && res.data.length > 0) {
    const realDocs: KnowledgeDoc[] = res.data.map((item, idx) => ({
      id: item.id || `BACKEND-DOC-${idx + 1}`,
      title: item.title,
      description: item.description || 'Registered in official backend knowledge repository',
      sourceName: item.source_name || 'Government Authority',
      sourceUrl: item.source_url || undefined,
      documentType: (item.document_type as DocumentType) || 'Guidelines',
      scope: 'State / National Authority',
      language: item.language || 'en',
      version: 'v1.0 (Live)',
      effectiveDate: '2025-01-01',
      status: 'Published' as DocumentStatus,
      lastUpdated: 'Live Database',
      isRealBackend: true,
      versions: [
        {
          version: 'v1.0',
          effectiveDate: '2025-01-01',
          status: 'Current',
          verificationState: 'Verified via Backend API',
          updatedBy: 'System Synced',
          notes: 'Retrieved directly from GET /api/knowledge/documents',
        },
      ],
    }));

    // Merge with our demo docs so operational workflow demo documents remain accessible
    return {
      docs: [...realDocs, ...localDocsState],
      isRealBackend: true,
      sourceLabel: `Connected to live backend (${realDocs.length} live docs + ${localDocsState.length} operational demos)`,
    };
  }

  // Fallback to centralized demo data
  return {
    docs: localDocsState,
    isRealBackend: false,
    sourceLabel: 'Demonstration Knowledge Base (Backend API standby)',
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

  // Fallback demo chunks matching
  const qLower = query.toLowerCase();
  const matchedChunks: ChunkSearchItem[] = [
    {
      content:
        'Section 73CB of the Maharashtra Cooperative Societies Act governs the state cooperative election authority. Elections must be conducted before the expiration of the 5-year managing committee tenure.',
      document_id: 'DOC-MH-2025-01',
      title: 'Maharashtra Cooperative Societies Act, 1960 (Amended 2024)',
      source_name: 'Dept of Cooperation, Govt of Maharashtra',
      document_type: 'Cooperative Law',
      language: 'en',
      similarity: 0.88,
    },
    {
      content:
        'Clause 15.2 PMFBY: In localized calamities (hailstorm, landslide, inundation), loss intimation must be submitted within 72 hours via Crop Insurance App, toll-free portal, or offline Annexure-IV to PACS secretary.',
      document_id: 'DOC-PMFBY-2025-04',
      title: 'PMFBY Operational Guidelines 2025–26',
      source_name: 'Ministry of Agriculture',
      document_type: 'PMFBY / Agriculture',
      language: 'en',
      similarity: 0.82,
    },
    {
      content:
        'PACS Model By-laws Clause 8: A Primary Agricultural Credit Society may undertake retail supply of fertilizers, seeds, pesticides, and manage cold storage/warehouses under AIF scheme.',
      document_id: 'DOC-PACS-BYLAWS-2024',
      title: 'Model By-laws for PACS (Computerization Edition)',
      source_name: 'NABARD & Ministry of Cooperation',
      document_type: 'By-laws',
      language: 'en',
      similarity: 0.76,
    },
  ].filter(
    (c) =>
      c.content.toLowerCase().includes(qLower) ||
      c.title.toLowerCase().includes(qLower) ||
      qLower.length <= 3
  );

  return {
    query,
    language,
    chunks: matchedChunks.length > 0 ? matchedChunks : [
      {
        content: `Knowledge chunk indexing match for query: "${query}". Real vector similarity available when FastAPI backend has live pgvector embeddings connected.`,
        document_id: 'DEMO-SIM-01',
        title: 'Model Cooperative Retrieval Chunk',
        source_name: 'SahkaarSetu RAG Vector Index',
        similarity: 0.74,
      },
    ],
    count: matchedChunks.length || 1,
    isRealBackend: false,
  };
}

export async function uploadDocumentPrototype(doc: {
  title: string;
  documentType: DocumentType;
  sourceName: string;
  sourceUrl?: string;
  scope: string;
  state?: string;
  pacsName?: string;
  scheme?: string;
  language: string;
  version: string;
  effectiveDate: string;
  expiryReviewDate?: string;
  applicability?: string;
  notes?: string;
}): Promise<{ doc: KnowledgeDoc; message: string }> {
  // Prototype simulation: Document upload is saved into local state with "Under Review" / "Pending Verification"
  const newDoc: KnowledgeDoc = {
    id: `DOC-PENDING-${Date.now().toString().slice(-4)}`,
    title: doc.title,
    documentType: doc.documentType,
    sourceName: doc.sourceName,
    sourceUrl: doc.sourceUrl,
    scope: doc.scope,
    state: doc.state,
    pacsName: doc.pacsName,
    scheme: doc.scheme,
    language: doc.language,
    version: doc.version || 'v1.0-draft',
    effectiveDate: doc.effectiveDate || new Date().toISOString().split('T')[0],
    expiryReviewDate: doc.expiryReviewDate,
    applicability: doc.applicability,
    status: 'Under Review',
    lastUpdated: new Date().toISOString().split('T')[0],
    isRealBackend: false,
    chunkCount: 0,
    notes: doc.notes,
    versions: [
      {
        version: doc.version || 'v1.0-draft',
        effectiveDate: doc.effectiveDate || new Date().toISOString().split('T')[0],
        status: 'Draft',
        verificationState: 'Pending Verification by Admin',
        updatedBy: 'Operations Staff (Upload Portal)',
        notes: doc.notes || 'Initial document upload awaiting review.',
      },
    ],
  };

  localDocsState = [newDoc, ...localDocsState];
  return {
    doc: newDoc,
    message: 'Document successfully registered for verification. (Prototype Demo: Awaiting Backend Upload API)',
  };
}

export async function approveAndPublishDocument(docId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const target = localDocsState.find((d) => d.id === docId);
  if (target) {
    target.status = 'Published';
    target.lastUpdated = new Date().toISOString().split('T')[0];
    if (target.versions && target.versions.length > 0) {
      target.versions[0].status = 'Current';
      target.versions[0].verificationState = 'Approved & Published by Admin';
    }
    return {
      success: true,
      message: `Document "${target.title}" approved and marked as Published. (Note: Vector re-index prototype step simulated)`,
    };
  }
  return {
    success: false,
    message: 'Document not found.',
  };
}

export async function rejectDocument(docId: string, reason: string): Promise<{
  success: boolean;
  message: string;
}> {
  const target = localDocsState.find((d) => d.id === docId);
  if (target) {
    target.status = 'Draft';
    if (target.versions && target.versions.length > 0) {
      target.versions[0].verificationState = `Changes Requested: ${reason}`;
    }
    return {
      success: true,
      message: `Document returned to Draft status. Feedback recorded: "${reason}"`,
    };
  }
  return {
    success: false,
    message: 'Document not found.',
  };
}
