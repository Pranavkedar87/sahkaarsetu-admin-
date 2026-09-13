import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Shield,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Send,
  Building,
  Calendar,
  Info,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingState, EmptyState } from '../components/common/FeedbackStates';
import {
  GrievanceRecord,
  GrievanceStatus,
  GrievanceCategory,
  GrievancePriority,
  Role,
} from '../types';
import {
  getGrievanceList,
  fetchGrievanceById,
  updateGrievanceStatus,
  assignGrievanceStaff,
  addGrievanceNote,
} from '../services/api/grievances';

interface GrievancesPageProps {
  role: Role;
}

export const GrievancesPage: React.FC<GrievancesPageProps> = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCase, setSelectedCase] = useState<GrievanceRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct ID lookup field
  const [directIdQuery, setDirectIdQuery] = useState('');
  const [directSearching, setDirectSearching] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await getGrievanceList();
      setGrievances(res.grievances);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const total = grievances.length;
  const newCount = grievances.filter((g) => g.status === 'New').length;
  const inProgressCount = grievances.filter((g) => g.status === 'In Progress' || g.status === 'Assigned').length;
  const escalatedCount = grievances.filter((g) => g.status === 'Escalated').length;
  const resolvedCount = grievances.filter((g) => g.status === 'Resolved').length;

  const filteredGrievances = grievances.filter((g) => {
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || g.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      g.id.toLowerCase().includes(q) ||
      g.citizenMaskedName.toLowerCase().includes(q) ||
      g.pacsName.toLowerCase().includes(q) ||
      g.citizenQuery.toLowerCase().includes(q);
    return matchesStatus && matchesCategory && matchesQuery;
  });

  const handleOpenCase = async (item: GrievanceRecord) => {
    setSelectedCase(item);
    setAssigneeName(item.assignedStaff || '');
    setNewNote('');
    setIsDetailOpen(true);

    // Fetch full live detail including conversation messages & notes
    try {
      const detailRes = await fetchGrievanceById(item.id);
      if (detailRes.grievance) {
        setSelectedCase(detailRes.grievance);
        setAssigneeName(detailRes.grievance.assignedStaff || '');
      }
    } catch {
      // Retain already selected item
    }
  };

  const handleStatusChange = async (newStatus: GrievanceStatus) => {
    if (!selectedCase) return;
    const res = await updateGrievanceStatus(selectedCase.id, newStatus, newNote || undefined);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 4000);
    if (res.success && res.record) {
      setSelectedCase(res.record);
      setGrievances((prev) =>
        prev.map((c) => (c.id === selectedCase.id ? res.record! : c))
      );
      setNewNote('');
    } else if (!res.success) {
      alert(res.message);
    }
  };

  const handleAssign = async () => {
    if (!selectedCase || !assigneeName.trim()) return;
    const res = await assignGrievanceStaff(selectedCase.id, assigneeName);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 4000);
    if (res.success && res.record) {
      setSelectedCase(res.record);
      setGrievances((prev) =>
        prev.map((c) => (c.id === selectedCase.id ? res.record! : c))
      );
    } else if (!res.success) {
      alert(res.message);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !newNote.trim()) return;
    const res = await addGrievanceNote(selectedCase.id, newNote);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 4000);
    if (res.success && res.record) {
      setSelectedCase(res.record);
      setGrievances((prev) =>
        prev.map((c) => (c.id === selectedCase.id ? res.record! : c))
      );
      setNewNote('');
    } else if (!res.success) {
      alert(res.message);
    }
  };

  const handleLookupDirectId = async () => {
    if (!directIdQuery.trim()) return;
    setDirectSearching(true);
    try {
      const res = await fetchGrievanceById(directIdQuery.trim());
      if (res.grievance) {
        handleOpenCase(res.grievance);
      } else {
        alert(res.error || `Grievance ID "${directIdQuery}" not found in backend.`);
      }
    } finally {
      setDirectSearching(false);
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
              Cooperative Grievance Redressal Desk
            </h2>
            <Badge variant="live">Live Backend Data • /api/admin/grievances</Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Monitor citizen complaints escalated from AI assistance, assign field officers, verify documentation, and resolve disputes.
          </p>
        </div>

        {/* Real Backend ID Lookup Widget */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Fetch UUID via GET /api/grievance/{id}"
            value={directIdQuery}
            onChange={(e) => setDirectIdQuery(e.target.value)}
            className="form-input"
            style={{ width: '250px', fontSize: '0.8rem' }}
          />
          <button
            onClick={handleLookupDirectId}
            disabled={directSearching}
            className="btn btn-secondary btn-sm"
          >
            {directSearching ? 'Fetching...' : 'Query ID'}
          </button>
        </div>
      </div>

      {/* Case Overview Counters */}
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
            Total Grievance Cases
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Across all 8 cooperative categories</div>
        </div>

        <div
          onClick={() => setStatusFilter('New')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--danger-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'New' ? 'var(--danger-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger-700)', textTransform: 'uppercase' }}>
            New / Unassigned
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger-700)', marginTop: '0.25rem' }}>
            {newCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger-700)' }}>Requires staff assignment</div>
        </div>

        <div
          onClick={() => setStatusFilter('In Progress')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--trust-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'In Progress' ? 'var(--trust-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--trust-700)', textTransform: 'uppercase' }}>
            In Progress / Under Review
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--trust-700)', marginTop: '0.25rem' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--trust-700)' }}>Field inquiry underway</div>
        </div>

        <div
          onClick={() => setStatusFilter('Escalated')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--warning-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'Escalated' ? 'var(--warning-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning-700)', textTransform: 'uppercase' }}>
            Escalated to DDR
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning-700)', marginTop: '0.25rem' }}>
            {escalatedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning-700)' }}>District Registrar involvement</div>
        </div>

        <div
          onClick={() => setStatusFilter('Resolved')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--success-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${statusFilter === 'Resolved' ? 'var(--success-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-700)', textTransform: 'uppercase' }}>
            Resolved Cases
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.25rem' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-700)' }}>Redressed satisfactorily</div>
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
            placeholder="Search grievance ID, citizen name, PACS, or issue description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="all">All Categories</option>
          <option value="PMFBY">PMFBY Crop Insurance</option>
          <option value="Financial">Financial / KCC</option>
          <option value="PACS Service">PACS Service</option>
          <option value="Cooperative Issue">Cooperative Issue</option>
          <option value="Scheme">Scheme Subvention</option>
          <option value="Documentation">Documentation</option>
          <option value="Other">Other</option>
        </select>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {(['all', 'New', 'In Progress', 'Escalated', 'Resolved'] as const).map((st) => (
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

      {/* Grievance Table */}
      {loading ? (
        <LoadingState message="Fetching grievance log..." />
      ) : filteredGrievances.length === 0 ? (
        <EmptyState
          title="No Grievances Found"
          description={`No cases match filter "${statusFilter}" or query "${searchQuery}".`}
          action={
            <button
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="table-responsive card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Citizen (Masked)</th>
                <th>PACS / Society</th>
                <th>Category</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Assigned Staff</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrievances.map((c) => {
                return (
                  <tr key={c.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--trust-700)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {c.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                        {c.citizenMaskedName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {c.citizenPhoneMasked}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--slate-800)' }}>{c.pacsName}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                        {c.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                      {c.date}
                    </td>
                    <td>
                      <Badge
                        variant={
                          c.priority === 'Urgent'
                            ? 'danger'
                            : c.priority === 'High'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {c.priority}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {c.assignedStaff ? (
                        <span style={{ color: 'var(--slate-800)', fontWeight: 500 }}>
                          {c.assignedStaff}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger-700)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge
                        variant={
                          c.status === 'Resolved'
                            ? 'success'
                            : c.status === 'New'
                            ? 'danger'
                            : c.status === 'Escalated'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenCase(c)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        Open Case
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Grievance Detail & Workflow Modal (Acceptance Demo 4) */}
      {selectedCase && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Grievance Redressal: ${selectedCase.id}`}
          subtitle={`${selectedCase.pacsName} • Category: ${selectedCase.category}`}
          badge={<Badge variant={selectedCase.status === 'Resolved' ? 'success' : 'warning'}>{selectedCase.status}</Badge>}
          maxWidth="760px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                Citizen data masked for privacy. No external filing claimed.
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Citizen Query & Summary */}
            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Citizen Grievance Submission
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Submitted: {selectedCase.date} • Priority: <strong>{selectedCase.priority}</strong>
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--slate-800)', padding: '0.5rem', background: '#ffffff', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                "{selectedCase.citizenQuery}"
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                <strong>Operational Summary:</strong> {selectedCase.contextSummary}
              </p>
            </div>

            {/* AI Guidance Provided & Grounding Source */}
            <div
              style={{
                backgroundColor: 'var(--trust-50)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <Sparkles size={16} style={{ color: 'var(--trust-700)' }} />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--trust-800)' }}>
                  Guidance Provided to Citizen by SahkaarSetu AI
                </h4>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--slate-700)', lineHeight: 1.5 }}>
                {selectedCase.aiGuidanceProvided}
              </p>
              {selectedCase.sourceReference && (
                <div style={{ fontSize: '0.75rem', color: 'var(--trust-700)', marginTop: '0.4rem', fontWeight: 600 }}>
                  Statutory Reference: {selectedCase.sourceReference}
                </div>
              )}
            </div>

            {/* Assignment & Status Controls (Acceptance Demo 4) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: '0.85rem',
                padding: '1rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
              }}
            >
              {/* Assign Staff */}
              <div className="form-group">
                <label className="form-label">Assign Field / Desk Officer</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="Enter officer name..."
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button onClick={handleAssign} className="btn btn-secondary btn-sm">
                    Assign
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                  Current assignee: {selectedCase.assignedStaff || 'None (Unassigned)'}
                </span>
              </div>

              {/* Status Actions */}
              <div className="form-group">
                <label className="form-label">Update Case Status</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleStatusChange('In Progress')}
                    className="btn btn-secondary btn-sm"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('Escalated')}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--warning-700)' }}
                  >
                    Escalate to DDR
                  </button>
                  <button
                    onClick={() => handleStatusChange('Resolved')}
                    className="btn btn-primary btn-sm"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>

            {/* Staff Investigation Log */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                Staff Action & Verification Notes
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {selectedCase.staffNotes && selectedCase.staffNotes.length > 0 ? (
                  selectedCase.staffNotes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.5rem',
                        backgroundColor: 'var(--slate-50)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {note}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    No notes recorded yet.
                  </p>
                )}
              </div>

              {/* Add Note Box */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Add verification note or document observation..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="btn btn-secondary btn-sm"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
