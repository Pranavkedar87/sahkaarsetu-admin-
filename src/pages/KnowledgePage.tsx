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
  Database,
  ArrowRight,
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
  uploadDocumentPrototype,
  approveAndPublishDocument,
  rejectDocument,
  ChunkSearchItem,
} from '../services/api/knowledge';

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

  // Upload Form State
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

  const handleApprove = async (docId: string) => {
    const res = await approveAndPublishDocument(docId);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 5000);
    fetchDocs();
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc({ ...selectedDoc, status: 'Published' });
    }
  };

  const handleReject = async (docId: string) => {
    const reason = prompt('Please provide feedback or reason for returning document to Draft:');
    if (!reason) return;
    const res = await rejectDocument(docId, reason);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 5000);
    fetchDocs();
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc({ ...selectedDoc, status: 'Draft' });
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
    if (!newTitle.trim()) return;

    const res = await uploadDocumentPrototype({
      title: newTitle,
      documentType: newType,
      sourceName: newSource,
      scope: newScope,
      state: newState,
      pacsName: newPacs || undefined,
      scheme: newScheme || undefined,
      language: newLanguage,
      version: newVersion,
      effectiveDate: newEffectiveDate,
      expiryReviewDate: newExpiryDate,
      applicability: newApplicability,
      notes: newNotes,
    });

    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 5000);
    setIsUploadOpen(false);
    // Reset form
    setNewTitle('');
    setNewNotes('');
    setUploadStep(1);
    fetchDocs();
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
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
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
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
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
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
                      <button
                        onClick={() => handleOpenDoc(doc)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        Inspect & Versions
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Detail & Version History Modal (Acceptance Demo 3) */}
      {selectedDoc && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={selectedDoc.title}
          subtitle={`Type: ${selectedDoc.documentType} • Source: ${selectedDoc.sourceName}`}
          badge={<Badge variant={selectedDoc.status === 'Published' ? 'success' : 'warning'}>{selectedDoc.status}</Badge>}
          maxWidth="760px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                {selectedDoc.isRealBackend
                  ? 'Source: Live FastAPI GET /api/knowledge/documents'
                  : 'Source: Centralized Demo Knowledge Base'}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedDoc.status !== 'Published' && (
                  <>
                    <button
                      onClick={() => handleReject(selectedDoc.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger-700)' }}
                    >
                      <X size={14} /> Reject / Request Changes
                    </button>
                    <button
                      onClick={() => handleApprove(selectedDoc.id)}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={14} /> Approve & Publish
                    </button>
                  </>
                )}
                <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Metadata Fields Section */}
            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                Document Metadata & Scope
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div><strong style={{ color: 'var(--slate-500)' }}>Scope:</strong> {selectedDoc.scope}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>State / Region:</strong> {selectedDoc.state || 'All India'}</div>
                <div><strong style={{ color: 'var(--slate-500)' }}>Applicable Scheme:</strong> {selectedDoc.scheme || 'General Cooperative'}</div>
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

            {/* Version History Section (Requirement 4) */}
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

            {/* Note on legal updates */}
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--trust-50)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--trust-800)',
                lineHeight: 1.4,
              }}
            >
              🔒 <strong>Operational Principle:</strong> When statutory amendments occur, staff publish a verified new version here. The AI RAG retriever instantly grounds future answers on the latest text chunks without needing retraining or weights fine-tuning.
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
            ⚠️ <strong>Safety Rule:</strong> Newly uploaded documents are marked as <strong>"Pending Verification"</strong>. They will NOT be indexed into live AI vector retrieval until an Admin performs review and explicitly approves publication.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsUploadOpen(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Register Document for Review
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
    </div>
  );
};
