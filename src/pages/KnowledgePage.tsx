import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  UploadCloud,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  History,
  Check,
  X,
  RefreshCw,
  Info,
  Send,
  Download,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingState, EmptyState } from '../components/common/FeedbackStates';
import {
  KnowledgeDoc,
  DocumentType,
  DocumentStatus,
  Role,
} from '../types';
import {
  getKnowledgeDocuments,
  searchKnowledgeChunks,
  uploadKnowledgeDocument,
  submitDocumentForReview,
  verifyKnowledgeDocument,
  publishKnowledgeDocument,
  rejectKnowledgeDocument,
  getDocumentDetails,
  getDocumentVersions,
  reindexKnowledgeDocument,
  ChunkSearchItem,
  VerifyPayload,
  DocumentVersionHistoryBackendResponse,
  ReindexBackendResponse,
} from '../services/api/knowledge';
import { API_BASE_URL } from '../services/api/client';

interface KnowledgePageProps {
  role: Role;
}

export const KnowledgePage: React.FC<KnowledgePageProps> = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [isBackendReal, setIsBackendReal] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSearchTesterOpen, setIsSearchTesterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vector Search Tester State
  const [testQuery, setTestQuery] = useState('How to file PMFBY loss within 72 hours?');
  const [testLanguage, setTestLanguage] = useState('en');
  const [searchChunks, setSearchChunks] = useState<ChunkSearchItem[]>([]);
  const [searchingVector, setSearchingVector] = useState(false);
  const [vectorSearchDone, setVectorSearchDone] = useState(false);

  // Upload Form & Review State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);
  const [verifyingDoc, setVerifyingDoc] = useState<KnowledgeDoc | null>(null);
  const [publishingDoc, setPublishingDoc] = useState<KnowledgeDoc | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [publishNotes, setPublishNotes] = useState<string>('');

  // Verification Form State
  const [verifyAuthority, setVerifyAuthority] = useState<string>('STATE_GOVERNMENT');
  const [verifyJurisdiction, setVerifyJurisdiction] = useState<string>('MAHARASHTRA');
  const [verifyApplicability, setVerifyApplicability] = useState<string>('All Primary Agricultural Credit Societies');
  const [verifyEffectiveDate, setVerifyEffectiveDate] = useState<string>('2026-06-01');
  const [verifyExpiryDate, setVerifyExpiryDate] = useState<string>('2027-12-31');
  const [verifyPrecedence, setVerifyPrecedence] = useState<number>(50);
  const [verifyNotes, setVerifyNotes] = useState<string>('Verified administrative authority and statutory validity.');

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<DocumentType>('Circular');
  const [newSource, setNewSource] = useState('District Registrar Desk');
  const [newScope, setNewScope] = useState('District Order');
  const [newState, setNewState] = useState('Maharashtra');
  const [newPacs, setNewPacs] = useState('');
  const [newScheme, setNewScheme] = useState('');
  const [newLanguage, setNewLanguage] = useState('Marathi, English');
  const [newVersion, setNewVersion] = useState('v1.0-draft');
  const [newEffectiveDate, setNewEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpiryDate, setNewExpiryDate] = useState('2026-12-31');
  const [newApplicability, setNewApplicability] = useState('All Primary Agricultural Credit Societies');
  const [newNotes, setNewNotes] = useState('');
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3>(1);

  // Phase 2B.4 Version Management & Safe Re-indexing State
  const [versionModalOpen, setVersionModalOpen] = useState<boolean>(false);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<KnowledgeDoc | null>(null);
  const [versionHistory, setVersionHistory] = useState<DocumentVersionHistoryBackendResponse | null>(null);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);

  const [reindexModalOpen, setReindexModalOpen] = useState<boolean>(false);
  const [reindexingDoc, setReindexingDoc] = useState<KnowledgeDoc | null>(null);
  const [isReindexing, setIsReindexing] = useState<boolean>(false);
  const [reindexStage, setReindexStage] = useState<string>('idle');
  const [reindexResult, setReindexResult] = useState<ReindexBackendResponse | null>(null);
  const [reindexNotes, setReindexNotes] = useState<string>('');


  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await getKnowledgeDocuments();
      setDocs(res.docs);
      setSourceLabel(res.sourceLabel);
      setIsBackendReal(res.isRealBackend);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const total = docs.length;
  const verifiedCount = docs.filter((d) => d.status === 'Verified' || d.status === 'Published').length;
  const reviewDueCount = docs.filter((d) => d.status === 'Review Due' || d.status === 'Under Review').length;
  const outdatedCount = docs.filter((d) => d.status === 'Outdated').length;

  const filteredDocs = docs.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesType = typeFilter === 'all' || d.documentType === typeFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      d.title.toLowerCase().includes(q) ||
      d.sourceName.toLowerCase().includes(q) ||
      d.documentType.toLowerCase().includes(q) ||
      (d.scheme && d.scheme.toLowerCase().includes(q));
    return matchesStatus && matchesType && matchesQuery;
  });

  const handleOpenDoc = (doc: KnowledgeDoc) => {
    setSelectedDoc(doc);
    setIsDetailOpen(true);
  };

  const handleOpenVerify = (doc: KnowledgeDoc) => {
    setVerifyingDoc(doc);
    setVerifyAuthority(doc.authorityLevel || 'STATE_GOVERNMENT');
    setVerifyJurisdiction(doc.jurisdiction || 'MAHARASHTRA');
    setVerifyApplicability(doc.applicability || 'All Primary Agricultural Credit Societies');
    setVerifyEffectiveDate(doc.effectiveDate || '2026-06-01');
    setVerifyExpiryDate(doc.expiryReviewDate || '2027-12-31');
    setVerifyPrecedence(doc.precedenceTier || 50);
    setVerifyNotes(doc.notes || 'Verified administrative authority and statutory validity.');
  };

  const handleSubmitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDoc) return;

    setIsVerifying(true);
    try {
      const res = await verifyKnowledgeDocument(verifyingDoc.id, {
        authority_level: verifyAuthority,
        jurisdiction: verifyJurisdiction,
        applicability: [verifyApplicability],
        effective_date: verifyEffectiveDate,
        expiry_review_date: verifyExpiryDate,
        precedence_tier: Number(verifyPrecedence),
        verification_notes: verifyNotes,
      });

      if (res.success && res.doc) {
        setToastMessage(`Document "${res.doc.title}" successfully verified by Administrator.`);
        setVerifyingDoc(null);
        await fetchDocs();
        if (selectedDoc && selectedDoc.id === verifyingDoc.id) {
          setSelectedDoc(res.doc);
        }
      } else {
        setToastMessage(res.error || 'Failed to verify document.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Error verifying document.');
    } finally {
      setIsVerifying(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleOpenPublish = (doc: KnowledgeDoc) => {
    setPublishingDoc(doc);
    setPublishNotes('Approved for publication by State Registrar Operations.');
  };

  const handleConfirmPublish = async () => {
    if (!publishingDoc) return;

    setIsPublishing(true);
    try {
      const res = await publishKnowledgeDocument(publishingDoc.id, publishNotes);
      if (res.success && res.doc) {
        setToastMessage(`Document published! ${res.chunksCount || 0} chunks embedded (768-dim) and activated in live RAG.`);
        setPublishingDoc(null);
        await fetchDocs();
        if (selectedDoc && selectedDoc.id === publishingDoc.id) {
          setSelectedDoc(res.doc);
        }
      } else {
        setToastMessage(res.error || 'Failed to publish document.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Error publishing document.');
    } finally {
      setIsPublishing(false);
      setTimeout(() => setToastMessage(null), 7000);
    }
  };

  const handleReject = async (docId: string) => {
    const reason = prompt('Please provide reason for returning document to DRAFT:');
    if (!reason) return;

    try {
      const res = await rejectKnowledgeDocument(docId, reason);
      if (res.success && res.doc) {
        setToastMessage(`Document returned to DRAFT.`);
        await fetchDocs();
        if (selectedDoc && selectedDoc.id === docId) {
          setSelectedDoc(res.doc);
        }
      } else {
        setToastMessage(res.error || 'Failed to return document to draft.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Error rejecting document.');
    } finally {
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleSubmitForReview = async (docId: string) => {
    setSubmittingReviewId(docId);
    try {
      const res = await submitDocumentForReview(docId, 'Submitted for administrative compliance review.');
      if (res.success && res.doc) {
        setToastMessage(`Document moved to UNDER_REVIEW.`);
        await fetchDocs();
        if (selectedDoc && selectedDoc.id === docId) {
          setSelectedDoc(res.doc);
        }
      } else {
        setToastMessage(res.error || 'Failed to submit document for review.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Error submitting for review.');
    } finally {
      setSubmittingReviewId(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleOpenVersionHistory = async (doc: KnowledgeDoc) => {
    setVersionHistoryDoc(doc);
    setVersionHistory(null);
    setVersionModalOpen(true);
    setLoadingVersions(true);
    try {
      const res = await getDocumentVersions(doc.id);
      if (res.success && res.history) {
        setVersionHistory(res.history);
      } else {
        setToastMessage(res.error || 'Failed to fetch document version lineage.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Error fetching version history.');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleOpenReindex = (doc: KnowledgeDoc) => {
    setReindexingDoc(doc);
    setReindexNotes('Administrative maintenance re-indexing.');
    setReindexStage('idle');
    setReindexResult(null);
    setReindexModalOpen(true);
  };

  const handleConfirmReindex = async () => {
    if (!reindexingDoc) return;
    setIsReindexing(true);
    setReindexStage('Preparing');

    const stageTimer1 = setTimeout(() => setReindexStage('Extracting'), 300);
    const stageTimer2 = setTimeout(() => setReindexStage('Generating embeddings'), 700);
    const stageTimer3 = setTimeout(() => setReindexStage('Validating'), 1200);
    const stageTimer4 = setTimeout(() => setReindexStage('Activating'), 1600);

    try {
      const res = await reindexKnowledgeDocument(reindexingDoc.id, reindexNotes);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);

      if (res.success && res.result) {
        setReindexStage('Completed');
        setReindexResult(res.result);
        setToastMessage(`Document re-indexed! ${res.result.chunks_created} fresh chunks active (768-dim, gemini-embedding-001).`);
        await fetchDocs();
        if (versionHistoryDoc && versionHistoryDoc.id === reindexingDoc.id) {
          handleOpenVersionHistory(versionHistoryDoc);
        }
      } else {
        setToastMessage(res.error || 'Re-indexing failed. Existing chunks remain untouched.');
        setReindexStage('idle');
      }
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      setToastMessage(err?.message || 'Error executing safe re-indexing.');
      setReindexStage('idle');
    } finally {
      setIsReindexing(false);
      setTimeout(() => setToastMessage(null), 8000);
    }
  };

  const handleRunVectorSearch = async () => {
    if (!testQuery.trim()) return;
    setSearchingVector(true);
    setVectorSearchDone(true);
    try {
      const res = await searchKnowledgeChunks(testQuery, testLanguage, 3);
      setSearchChunks(res.chunks);
    } finally {
      setSearchingVector(false);
    }
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setToastMessage('Document title is required.');
      return;
    }
    if (!selectedFile) {
      setToastMessage('Please select a valid document file (.pdf, .txt, .md, .json, .csv).');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', newTitle.trim());
      formData.append('document_type', newType);
      formData.append('source_name', newSource.trim());
      if (newNotes.trim()) formData.append('description', newNotes.trim());
      if (newLanguage.trim()) formData.append('language', newLanguage.trim());
      if (newVersion.trim()) formData.append('version', newVersion.trim());
      if (newEffectiveDate) formData.append('effective_date', newEffectiveDate);
      if (newExpiryDate) formData.append('expiry_review_date', newExpiryDate);
      if (newScope.trim()) formData.append('jurisdiction', newScope.trim().toUpperCase());
      if (newApplicability.trim()) formData.append('applicability', newApplicability.trim());

      const res = await uploadKnowledgeDocument(formData);
      if (res.success && res.doc) {
        setToastMessage(`Document "${res.doc.title}" registered as DRAFT (safe from citizen retrieval).`);
        setIsUploadOpen(false);
        // Reset
        setSelectedFile(null);
        setNewTitle('');
        setNewNotes('');
        setUploadStep(1);
        await fetchDocs();
      } else {
        setToastMessage(res.error || 'Failed to upload document.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Error uploading document.');
    } finally {
      setUploading(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--trust-50)',
            border: '1px solid #93c5fd',
            borderRadius: 'var(--radius-md)',
            color: 'var(--trust-800)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Info size={16} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Knowledge Base Management
            </h2>
            <Badge variant={isBackendReal ? 'live' : 'demo'}>
              {isBackendReal ? 'Connected to FastAPI' : 'Demo Knowledge Base'}
            </Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Official source of truth. Manage cooperative laws, model by-laws, government schemes, circulars, and version history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsSearchTesterOpen(true)} className="btn btn-outline-primary btn-sm">
            <Search size={14} /> Test Vector Retrieval
          </button>
          <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary btn-sm">
            <UploadCloud size={14} /> Upload Official Document
          </button>
        </div>
      </div>

      {/* Knowledge Health Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '1rem' }}>
        <div
          onClick={() => setStatusFilter('all')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'all' ? 'var(--primary-700)' : 'var(--border-color)'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Registered Documents
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{sourceLabel}</div>
        </div>

        <div
          onClick={() => setStatusFilter('Published')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--success-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'Published' ? 'var(--success-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-700)', textTransform: 'uppercase' }}>
            Current & Verified
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.25rem' }}>
            {verifiedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-700)' }}>Active in RAG grounding index</div>
        </div>

        <div
          onClick={() => setStatusFilter('Review Due')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--warning-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'Review Due' ? 'var(--warning-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning-700)', textTransform: 'uppercase' }}>
            Review Due / Pending
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning-700)', marginTop: '0.25rem' }}>
            {reviewDueCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning-700)' }}>Expiring schemes or new uploads</div>
        </div>

        <div
          onClick={() => setStatusFilter('Outdated')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--slate-100)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'Outdated' ? 'var(--slate-600)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase' }}>
            Outdated / Superseded
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-600)', marginTop: '0.25rem' }}>
            {outdatedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Excluded from current answers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 220px)' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--slate-400)',
            }}
          />
          <input
            type="text"
            placeholder="Search document title, source, scheme or law..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Type Filter dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="all">All Document Types</option>
          <option value="Cooperative Law">Cooperative Law</option>
          <option value="By-laws">By-laws</option>
          <option value="Government Scheme">Government Scheme</option>
          <option value="Circular">Circular</option>
          <option value="PMFBY / Agriculture">PMFBY / Agriculture</option>
          <option value="Financial Literacy">Financial Literacy</option>
          <option value="Guidelines">Guidelines</option>
        </select>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {(['all', 'Published', 'Review Due', 'Under Review', 'Outdated'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <LoadingState message="Connecting to GET /api/knowledge/documents..." />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description={`No documents match the filter "${statusFilter}" or query "${searchQuery}".`}
          action={
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setSearchQuery('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Clear Filters
            </button>
          }
        />
      ) : (
        <div className="table-responsive card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Type</th>
                <th>Source</th>
                <th>Version</th>
                <th>Effective Date</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const isPublished = doc.status === 'Published' || doc.status === 'Verified';
                const isReviewDue = doc.status === 'Review Due' || doc.status === 'Under Review';

                return (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)', maxWidth: '320px' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {doc.scope} {doc.state ? `• ${doc.state}` : ''}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--trust-700)' }}>
                        {doc.documentType}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-700)' }}>{doc.sourceName}</div>
                      {doc.sourceUrl && (
                        <a
                          href={doc.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.7rem', color: 'var(--trust-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          Official link <ExternalLink size={10} />
                        </a>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {doc.version}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                      {doc.effectiveDate}
                    </td>
                    <td>
                      <Badge
                        variant={isPublished ? 'success' : isReviewDue ? 'warning' : 'neutral'}
                      >
                        {doc.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      {doc.lastUpdated}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {(doc.status === 'Draft' || doc.status?.toLowerCase() === 'draft') && (
                          <button
                            onClick={() => handleSubmitForReview(doc.id)}
                            disabled={submittingReviewId === doc.id}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Submit draft document for admin review"
                          >
                            <Send size={12} /> {submittingReviewId === doc.id ? 'Submitting...' : 'Submit Review'}
                          </button>
                        )}
                        {(doc.status === 'Under Review' || doc.status?.toLowerCase() === 'under_review') && (
                          role === 'ADMIN' ? (
                            <button
                              onClick={() => handleOpenVerify(doc)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--trust-700)' }}
                              title="Verify governance evidence (ADMIN only)"
                            >
                              <CheckCircle2 size={12} /> Verify Evidence
                            </button>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'var(--warning-100)', color: 'var(--warning-800)', fontSize: '0.7rem' }}>
                              Under Admin Review
                            </span>
                          )
                        )}
                        {(doc.status === 'Verified' || doc.status?.toLowerCase() === 'verified') && (
                          role === 'ADMIN' ? (
                            <button
                              onClick={() => handleOpenPublish(doc)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--success-700)' }}
                              title="Publish verified document into live citizen RAG (ADMIN only)"
                            >
                              <Sparkles size={12} /> Approve & Publish
                            </button>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'var(--success-100)', color: 'var(--success-800)', fontSize: '0.7rem' }}>
                              Pending Admin Publish
                            </span>
                          )
                        )}
                        {((doc.status === 'Published' || doc.status?.toLowerCase() === 'published') && doc.is_current) && (
                          role === 'ADMIN' ? (
                            <button
                              onClick={() => handleOpenReindex(doc)}
                              className="btn btn-outline-primary btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              title="Safely re-generate embeddings and refresh vector index (ADMIN only)"
                            >
                              <RefreshCw size={12} /> Re-index
                            </button>
                          ) : (
                            <button
                              disabled
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', opacity: 0.5, cursor: 'not-allowed' }}
                              title="Re-indexing is restricted to Administrators"
                            >
                              <RefreshCw size={12} /> Re-index (Admin)
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleOpenVersionHistory(doc)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          title="View document lineage and version history"
                        >
                          <History size={12} /> Versions
                        </button>
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Inspect & Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Detail & Version History Modal (Phase 2B.3 Governance) */}
      {selectedDoc && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedDoc.title}
          subtitle={`Type: ${selectedDoc.documentType} • Source: ${selectedDoc.sourceName}`}
          badge={<Badge variant={selectedDoc.status === 'Published' ? 'success' : selectedDoc.status === 'Verified' ? 'success' : selectedDoc.status === 'Under Review' ? 'warning' : 'neutral'}>{selectedDoc.status}</Badge>}
          maxWidth="760px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                {selectedDoc.isRealBackend
                  ? 'Connected to FastAPI Knowledge Engine'
                  : 'Source: Centralized Demo Knowledge Base'}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {(selectedDoc.status === 'Draft' || selectedDoc.status?.toLowerCase() === 'draft') && (
                  <button
                    onClick={() => handleSubmitForReview(selectedDoc.id)}
                    disabled={submittingReviewId === selectedDoc.id}
                    className="btn btn-primary btn-sm"
                  >
                    <Send size={14} /> {submittingReviewId === selectedDoc.id ? 'Submitting...' : 'Submit for Review'}
                  </button>
                )}
                {(selectedDoc.status === 'Under Review' || selectedDoc.status?.toLowerCase() === 'under_review') && (
                  role === 'ADMIN' ? (
                    <>
                      <button
                        onClick={() => handleReject(selectedDoc.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger-700)' }}
                      >
                        <X size={14} /> Reject to Draft
                      </button>
                      <button
                        onClick={() => {
                          setIsDetailOpen(false);
                          handleOpenVerify(selectedDoc);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: 'var(--trust-700)' }}
                      >
                        <CheckCircle2 size={14} /> Verify Governance Evidence
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning-700)', fontWeight: 600 }}>
                      Under administrative verification
                    </span>
                  )
                )}
                {(selectedDoc.status === 'Verified' || selectedDoc.status?.toLowerCase() === 'verified') && (
                  role === 'ADMIN' ? (
                    <>
                      <button
                        onClick={() => handleReject(selectedDoc.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger-700)' }}
                      >
                        <X size={14} /> Return to Draft
                      </button>
                      <button
                        onClick={() => {
                          setIsDetailOpen(false);
                          handleOpenPublish(selectedDoc);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: 'var(--success-700)' }}
                      >
                        <Sparkles size={14} /> Approve & Publish to Live RAG
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success-700)', fontWeight: 600 }}>
                      Verified. Admin publication pending.
                    </span>
                  )
                )}
                {((selectedDoc.status === 'Published' || selectedDoc.status?.toLowerCase() === 'published') && selectedDoc.is_current) && (
                  role === 'ADMIN' ? (
                    <button
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenReindex(selectedDoc);
                      }}
                      className="btn btn-outline-primary btn-sm"
                      title="Safely re-generate embeddings and refresh vector index"
                    >
                      <RefreshCw size={14} /> Safe Re-index
                    </button>
                  ) : (
                    <button
                      disabled
                      className="btn btn-secondary btn-sm"
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}
                      title="Re-indexing restricted to Administrators"
                    >
                      <RefreshCw size={14} /> Safe Re-index (Admin)
                    </button>
                  )
                )}
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenVersionHistory(selectedDoc);
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Inspect full version history and lineage"
                >
                  <History size={14} /> Full Version Lineage
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Governance Safeguard Banner */}
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: selectedDoc.is_current ? 'var(--success-50)' : 'var(--trust-50)',
                border: `1px solid ${selectedDoc.is_current ? '#86efac' : '#bfdbfe'}`,
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: selectedDoc.is_current ? 'var(--success-800)' : 'var(--trust-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>Grounding Safety Gate: </strong>
                {selectedDoc.is_current ? (
                  <span>✅ Active in live Citizen RAG vector retrieval</span>
                ) : (
                  <span>🛡️ <strong>ISOLATED</strong> — Cannot participate in citizen RAG search (status={selectedDoc.status}, is_current=false).</span>
                )}
              </div>
              <Badge variant={selectedDoc.is_current ? 'success' : 'neutral'}>
                {selectedDoc.is_current ? 'CURRENT' : 'INACTIVE'}
              </Badge>
            </div>

            {/* Governance & Administrative Metadata */}
            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                Governance & Administrative Fields
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div><strong style={{ color: 'var(--slate-500)' }}>Verification Status:</strong> {selectedDoc.verificationStatus || 'NEEDS_VERIFICATION'}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Currentness Status:</strong> {selectedDoc.currentnessStatus || 'NEEDS_VERIFICATION'}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Authority Level:</strong> {selectedDoc.authorityLevel || 'DISTRICT'}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Precedence Tier:</strong> Tier {selectedDoc.precedenceTier ?? 4}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Jurisdiction:</strong> {selectedDoc.jurisdiction || selectedDoc.scope || 'General'}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Language:</strong> {selectedDoc.language}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Effective Date:</strong> {selectedDoc.effectiveDate}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Review / Expiry:</strong> {selectedDoc.expiryReviewDate || 'Perpetual unless amended'}</div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong style={{ color: 'var(--slate-500)' }}>Applicability Rule:</strong> {selectedDoc.applicability || 'Applicable to all registered members.'}
                </div>
                {selectedDoc.description && (
                  <div style={{ gridColumn: 'span 2', marginTop: '0.25rem' }}>
                    <strong style={{ color: 'var(--slate-500)' }}>Summary:</strong> {selectedDoc.description}
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded File Assets & Download */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} style={{ color: 'var(--primary-700)' }} />
                  {selectedDoc.fileName || `${selectedDoc.title}.pdf`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                  {selectedDoc.fileSizeBytes ? `${(selectedDoc.fileSizeBytes / 1024).toFixed(1)} KB` : 'Verified source attachment'}
                </div>
              </div>

              <a
                href={`${API_BASE_URL}/api/admin/knowledge/documents/${selectedDoc.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
              >
                <Download size={14} /> Download Document
              </a>
            </div>

            {/* Version History Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <History size={16} style={{ color: 'var(--primary-700)' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Document Version History (Grounding Source of Truth)
                </h4>
              </div>

              {selectedDoc.versions && selectedDoc.versions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedDoc.versions.map((ver, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: ver.status === 'Current' ? 'var(--primary-50)' : '#ffffff',
                        border: `1px solid ${ver.status === 'Current' ? 'var(--primary-200)' : 'var(--border-color)'}`,
                        borderRadius: '6px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                            {ver.version}
                          </span>
                          <Badge variant={ver.status === 'Current' ? 'success' : 'neutral'}>
                            {ver.status}
                          </Badge>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            Effective: {ver.effectiveDate}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
                          {ver.verificationState} • Verified by: {ver.updatedBy}
                        </div>
                        {ver.notes && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontStyle: 'italic', marginTop: '0.1rem' }}>
                            "{ver.notes}"
                          </div>
                        )}
                      </div>

                      {ver.status === 'Current' && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                          Active in AI RAG
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  Single registered version in database.
                </p>
              )}
            </div>

            {/* Note on Phase 2B.2 vs Phase 2B.3 */}
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--warning-50)',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--warning-800)',
                lineHeight: 1.4,
              }}
            >
              🔒 <strong>Phase 2B.2 Protocol:</strong> Ingestion and administrative review only. Vector chunking and citizen RAG publishing are restricted to Phase 2B.3. No unapproved draft can enter citizen retrieval.
            </div>
          </div>
        </Modal>
      )}

      {/* Document Upload Workflow Modal (Requirement 3) */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Official Document Ingestion Workflow"
        subtitle="Step-by-step upload, metadata tagging, and review protocol"
        badge={<Badge variant="demo">Prototype Workflow</Badge>}
        maxWidth="680px"
      >
        <form onSubmit={handleSubmitUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Visual Step Indicator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--slate-50)',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <span style={{ color: uploadStep >= 1 ? 'var(--primary-700)' : 'var(--slate-400)' }}>
              1. Upload & Extract
            </span>
            <span>→</span>
            <span style={{ color: uploadStep >= 2 ? 'var(--primary-700)' : 'var(--slate-400)' }}>
              2. Tag Metadata
            </span>
            <span>→</span>
            <span style={{ color: 'var(--warning-700)' }}>
              3. Verification Required
            </span>
          </div>

          {/* File Picker */}
          <div className="form-group">
            <label className="form-label">Document Source File (.pdf, .txt, .md, .json, .csv) *</label>
            <input
              type="file"
              required
              accept=".pdf,.txt,.md,.json,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedFile(f);
                if (f && !newTitle) {
                  // Auto-populate title from clean filename
                  const base = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                  setNewTitle(base.charAt(0).toUpperCase() + base.slice(1));
                }
              }}
              className="form-input"
              style={{ padding: '0.5rem' }}
            />
            {selectedFile && (
              <div style={{ fontSize: '0.75rem', color: 'var(--trust-700)', marginTop: '0.35rem', fontWeight: 600 }}>
                Attached: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Circular No. 22/2026: PACS Fertilizer Credit Margins"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Document Type *</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as DocumentType)}
                className="form-select"
              >
                <option value="Circular">Circular</option>
                <option value="Cooperative Law">Cooperative Law</option>
                <option value="By-laws">By-laws</option>
                <option value="Government Scheme">Government Scheme</option>
                <option value="PACS Document">PACS Document</option>
                <option value="PMFBY / Agriculture">PMFBY / Agriculture</option>
                <option value="Financial Literacy">Financial Literacy</option>
                <option value="Guidelines">Guidelines</option>
                <option value="Other Official Document">Other Official Document</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Issuing Authority / Source *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dept of Cooperation, Govt of Maharashtra"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Jurisdiction Scope</label>
              <input
                type="text"
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Effective Date</label>
              <input
                type="date"
                value={newEffectiveDate}
                onChange={(e) => setNewEffectiveDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Review / Expiry Date</label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Applicability & Legal Mandate</label>
            <input
              type="text"
              placeholder="e.g. All PACS advancing short-term kharif loans in Maharashtra"
              value={newApplicability}
              onChange={(e) => setNewApplicability(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Operational Review Notes</label>
            <textarea
              placeholder="Highlight clauses or amendments that differ from the previous year..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--warning-50)',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'var(--warning-700)',
            }}
          >
            ⚠️ <strong>Safety Rule:</strong> Newly uploaded documents are marked as <strong>"DRAFT / NEEDS_VERIFICATION"</strong>. They will NOT be indexed into live AI vector retrieval until an Admin explicitly approves and publishes them in Phase 2B.3.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsUploadOpen(false)} className="btn btn-secondary btn-sm" disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={uploading}>
              {uploading ? 'Uploading & Registering...' : 'Register Document as Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vector Similarity Search Tester Modal */}
      <Modal
        isOpen={isSearchTesterOpen}
        onClose={() => setIsSearchTesterOpen(false)}
        title="Knowledge Base Vector Search Inspector"
        subtitle="Simulate semantic retrieval against official registered chunks"
        badge={<Badge variant="info">RAG Grounding</Badge>}
        maxWidth="740px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter citizen question to test semantic retrieval..."
              className="form-input"
            />
            <select
              value={testLanguage}
              onChange={(e) => setTestLanguage(e.target.value)}
              className="form-select"
              style={{ width: '110px' }}
            >
              <option value="en">English</option>
              <option value="mr">Marathi</option>
              <option value="hi">Hindi</option>
            </select>
            <button
              onClick={handleRunVectorSearch}
              disabled={searchingVector}
              className="btn btn-primary btn-sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              {searchingVector ? 'Searching...' : 'Search Chunks'}
            </button>
          </div>

          {vectorSearchDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                Retrieved {searchChunks.length} most relevant vector chunks:
              </div>

              {searchChunks.map((chunk, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--slate-50)',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>
                      {chunk.title}
                    </span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: chunk.similarity > 0.8 ? 'var(--success-100)' : 'var(--trust-100)',
                        color: chunk.similarity > 0.8 ? 'var(--success-700)' : 'var(--trust-700)',
                        fontSize: '0.7rem',
                      }}
                    >
                      Cosine Match: {Math.round(chunk.similarity * 100)}%
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-700)', lineHeight: 1.5 }}>
                    "{chunk.content}"
                  </p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.4rem' }}>
                    Source: {chunk.source_name || 'Official Knowledge'} • Doc ID: {chunk.document_id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Document Verification Modal (ADMIN-only Phase 2B.3) */}
      {verifyingDoc && (
        <Modal
          isOpen={!!verifyingDoc}
          onClose={() => setVerifyingDoc(null)}
          title={`Verify Governance Evidence: ${verifyingDoc.title}`}
          subtitle="Legal verification and compliance certification before publication"
          badge={<Badge variant="warning">Administrative Verification</Badge>}
          maxWidth="680px"
        >
          <form onSubmit={handleSubmitVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--trust-50)',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--trust-800)',
              }}
            >
              ℹ️ <strong>Governance Rule:</strong> Verification validates issuing authority, statutory jurisdiction, and target applicability. Only verified documents may proceed to publication.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Authority Level *</label>
                <select
                  value={verifyAuthority}
                  onChange={(e) => setVerifyAuthority(e.target.value)}
                  className="form-select"
                >
                  <option value="CENTRAL_GOVERNMENT">Central Government</option>
                  <option value="STATE_GOVERNMENT">State Government</option>
                  <option value="DISTRICT_COLLECTOR">District Collector</option>
                  <option value="DISTRICT_REGISTRAR">District Registrar</option>
                  <option value="APEX_BANK">Apex Cooperative Bank (NABARD/MSC)</option>
                  <option value="DCCB">DCCB District Bank</option>
                  <option value="PACS">PACS Primary Society</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jurisdiction *</label>
                <input
                  type="text"
                  required
                  value={verifyJurisdiction}
                  onChange={(e) => setVerifyJurisdiction(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Verified Applicability Mandate *</label>
              <input
                type="text"
                required
                value={verifyApplicability}
                onChange={(e) => setVerifyApplicability(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={verifyEffectiveDate}
                  onChange={(e) => setVerifyEffectiveDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expiry / Review Date</label>
                <input
                  type="date"
                  value={verifyExpiryDate}
                  onChange={(e) => setVerifyExpiryDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Precedence Tier (1-100) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={verifyPrecedence}
                  onChange={(e) => setVerifyPrecedence(Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Administrative Verification Notes</label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="form-textarea"
                placeholder="Certified compliant with Maharashtra Cooperative Societies Act..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setVerifyingDoc(null)} className="btn btn-secondary btn-sm" disabled={isVerifying}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isVerifying} style={{ backgroundColor: 'var(--trust-700)' }}>
                {isVerifying ? 'Certifying Verification...' : 'Confirm & Mark Verified'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Publication Confirmation Modal (ADMIN-only Phase 2B.3) */}
      {publishingDoc && (
        <Modal
          isOpen={!!publishingDoc}
          onClose={() => !isPublishing && setPublishingDoc(null)}
          title={`Publish to Live RAG: ${publishingDoc.title}`}
          subtitle="Generate 768-dim Gemini embeddings and activate in citizen knowledge index"
          badge={<Badge variant="success">Admin Publication</Badge>}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '0.85rem',
                backgroundColor: 'var(--warning-50)',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--warning-900)',
                lineHeight: 1.5,
              }}
            >
              🚀 <strong>Staged Publication Protocol:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
                <li>Extract text from persisted source attachment (<code>{publishingDoc.fileName || 'document.pdf'}</code>).</li>
                <li>Deterministically chunk into coherent semantic sections.</li>
                <li>Generate 768-dimensional embeddings using <code>gemini-embedding-001</code>.</li>
                <li>Atomically activate in live retrieval (<code>is_current=True</code>, <code>status=published</code>).</li>
                <li>Mark any older version of this document as superseded.</li>
              </ul>
            </div>

            <div style={{ backgroundColor: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              <div><strong>Issuing Authority:</strong> {publishingDoc.authorityLevel || 'State Government'}</div>
              <div><strong>Jurisdiction:</strong> {publishingDoc.jurisdiction || 'Maharashtra'}</div>
              <div><strong>Applicability:</strong> {publishingDoc.applicability || 'All Cooperatives'}</div>
              <div><strong>Effective Date:</strong> {publishingDoc.effectiveDate}</div>
              <div><strong>Verification Status:</strong> {publishingDoc.verificationStatus || 'VERIFIED_OFFICIAL'}</div>
              <div><strong>Currentness Status:</strong> {publishingDoc.currentnessStatus || 'CURRENT'}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Publication Release Notes</label>
              <textarea
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                className="form-textarea"
                placeholder="Publication approval notes for audit record..."
              />
            </div>

            {isPublishing && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--primary-800)',
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={18} className="animate-spin" />
                <span>Generating 768-dim Gemini embeddings & indexing live chunks. Please wait...</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setPublishingDoc(null)}
                className="btn btn-secondary btn-sm"
                disabled={isPublishing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="btn btn-primary btn-sm"
                disabled={isPublishing}
                style={{ backgroundColor: 'var(--success-700)' }}
              >
                {isPublishing ? 'Publishing & Indexing...' : 'Approve & Publish to Citizen RAG'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Version History & Lineage Modal (Phase 2B.4) */}
      {versionModalOpen && versionHistoryDoc && (
        <Modal
          isOpen={versionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          title={`Version Lineage: ${versionHistoryDoc.title}`}
          subtitle="Lineage tracking for official document versions"
          badge={<Badge variant="info">Phase 2B.4 Governance</Badge>}
          maxWidth="840px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--slate-50)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>CURRENT IN-FORCE VERSION: </span>
                <span style={{ fontWeight: 800, color: 'var(--success-700)', fontFamily: 'var(--font-mono)' }}>
                  {versionHistory?.current_version || 'None active'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                Total Recorded Versions: <strong>{versionHistory?.total_versions || 1}</strong>
              </div>
            </div>

            {loadingVersions ? (
              <LoadingState message="Loading document version lineage from backend..." />
            ) : versionHistory && versionHistory.versions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {versionHistory.versions.map((ver) => {
                  const isCurrentInForce = ver.is_current && ver.status === 'published';
                  const isSuperseded = ver.status === 'superseded' || ver.currentness_status === 'SUPERSEDED';

                  return (
                    <div
                      key={ver.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: isCurrentInForce ? 'var(--success-50)' : '#ffffff',
                        border: `1.5px solid ${isCurrentInForce ? '#86efac' : 'var(--border-color)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--slate-900)' }}>
                            {ver.version}
                          </span>
                          {isCurrentInForce ? (
                            <Badge variant="success">CURRENT (In Force)</Badge>
                          ) : isSuperseded ? (
                            <span className="badge" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-600)', fontSize: '0.7rem' }}>
                              SUPERSEDED
                            </span>
                          ) : (
                            <Badge variant={ver.status === 'published' ? 'success' : ver.status === 'under_review' ? 'warning' : 'neutral'}>
                              {ver.status.toUpperCase()}
                            </Badge>
                          )}
                          <span
                            className="badge"
                            style={{
                              backgroundColor: (ver.chunks_count || 0) > 0 ? 'var(--trust-100)' : 'var(--slate-100)',
                              color: (ver.chunks_count || 0) > 0 ? 'var(--trust-800)' : 'var(--slate-500)',
                              fontSize: '0.7rem',
                            }}
                          >
                            {ver.chunks_count || 0} Vector Chunks (768-dim)
                          </span>
                        </div>

                        {isCurrentInForce && (
                          role === 'ADMIN' ? (
                            <button
                              onClick={() => {
                                const foundDoc = docs.find((d) => d.id === ver.id) || versionHistoryDoc;
                                handleOpenReindex(foundDoc);
                              }}
                              className="btn btn-outline-primary btn-sm"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <RefreshCw size={12} /> Safe Re-index
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                              Re-index restricted to Admin
                            </span>
                          )
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                        <div><strong style={{ color: 'var(--slate-500)' }}>Effective Date:</strong> {ver.effective_date || 'N/A'}</div>
                        <div><strong style={{ color: 'var(--slate-500)' }}>Verification:</strong> {ver.verification_status || 'NEEDS_VERIFICATION'}</div>
                        <div><strong style={{ color: 'var(--slate-500)' }}>Currency:</strong> {ver.currentness_status || 'NEEDS_VERIFICATION'}</div>
                        <div><strong style={{ color: 'var(--slate-500)' }}>Created:</strong> {ver.created_at ? ver.created_at.split('T')[0] : 'N/A'}</div>
                        <div><strong style={{ color: 'var(--slate-500)' }}>Published:</strong> {ver.published_at ? ver.published_at.split('T')[0] : 'Unpublished'}</div>
                        {ver.published_by && <div><strong style={{ color: 'var(--slate-500)' }}>Published By:</strong> {ver.published_by}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                No version lineage found for this document.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setVersionModalOpen(false)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Safe Re-Indexing Confirmation Modal (Phase 2B.4 ADMIN-only) */}
      {reindexModalOpen && reindexingDoc && (
        <Modal
          isOpen={reindexModalOpen}
          onClose={() => !isReindexing && setReindexModalOpen(false)}
          title={`Safe Re-Indexing: ${reindexingDoc.title}`}
          subtitle="Atomic re-generation of 768-dim Gemini embeddings with zero downtime"
          badge={<Badge variant="info">Safe Re-index Protocol</Badge>}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '0.85rem',
                backgroundColor: 'var(--trust-50)',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--trust-900)',
                lineHeight: 1.5,
              }}
            >
              🛡️ <strong>Safety Invariant Guarantee:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
                <li>Document must be currently <strong>Published</strong> and <strong>Current</strong>.</li>
                <li>New embeddings are generated and validated at <strong>768 dimensions</strong> before live chunks are touched.</li>
                <li>If any error occurs (extraction, API outage, dimension mismatch), old chunks remain <strong>100% untouched</strong>.</li>
                <li>Zero citizen RAG disruption or partial state exposure.</li>
              </ul>
            </div>

            {isReindexing && (
              <div
                style={{
                  backgroundColor: 'var(--slate-50)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-800)', fontSize: '0.85rem' }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Re-indexing in progress: <strong>{reindexStage}...</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                  {['Preparing', 'Extracting', 'Generating embeddings', 'Validating', 'Activating'].map((st) => {
                    const isActive = reindexStage === st;
                    return (
                      <span key={st} style={{ color: isActive ? 'var(--primary-700)' : 'var(--slate-400)', fontWeight: isActive ? 800 : 500 }}>
                        {st}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {reindexResult && (
              <div
                style={{
                  backgroundColor: 'var(--success-50)',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #86efac',
                  fontSize: '0.8rem',
                  color: 'var(--success-900)',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="#15803d" />
                  <span>Re-indexing Successfully Completed</span>
                </div>
                <div>Fresh Chunks Created: <strong>{reindexResult.chunks_created}</strong></div>
                <div>Embedding Model: <strong>{reindexResult.embedding_model}</strong> (dimension {reindexResult.embedding_dimension})</div>
                <div>Re-indexed Timestamp: <strong>{reindexResult.reindexed_at}</strong></div>
              </div>
            )}

            {!reindexResult && (
              <div className="form-group">
                <label className="form-label">Audit / Maintenance Notes (Optional)</label>
                <textarea
                  value={reindexNotes}
                  onChange={(e) => setReindexNotes(e.target.value)}
                  className="form-textarea"
                  placeholder="Reason for re-indexing (e.g. routine index refresh, updated chunking granularity)..."
                  disabled={isReindexing}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setReindexModalOpen(false)}
                className="btn btn-secondary btn-sm"
                disabled={isReindexing}
              >
                {reindexResult ? 'Close' : 'Cancel'}
              </button>
              {!reindexResult && (
                <button
                  type="button"
                  onClick={handleConfirmReindex}
                  className="btn btn-primary btn-sm"
                  disabled={isReindexing}
                >
                  {isReindexing ? 'Executing Safe Re-index...' : 'Confirm & Execute Re-index'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
