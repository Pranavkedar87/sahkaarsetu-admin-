import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  User,
  Tag,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  XCircle,
  HelpCircle,
  Database,
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { fetchAuditLogs, formatAuditDate } from '../services/api/audit';
import { LoadingState, EmptyState, ErrorState } from '../components/common/FeedbackStates';

interface AuditLogsPageProps {
  role?: string;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [searchEntityId, setSearchEntityId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Selected Log Item for Detail Modal / Slide-out
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLogs({
        page: currentPage,
        pageSize,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        entityId: searchEntityId.trim() || undefined,
      });

      if (res.status === 'error') {
        setError('Failed to fetch audit logs from backend.');
        setLogs([]);
        setTotalRecords(0);
      } else {
        setLogs(res.items);
        setTotalRecords(res.total);
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with audit logging service.');
      setLogs([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedAction, selectedEntityType, searchEntityId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleActionChange = (action: string) => {
    setSelectedAction(action);
    setCurrentPage(1);
  };

  const handleEntityTypeChange = (type: string) => {
    setSelectedEntityType(type);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadLogs();
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  const getActionBadgeColor = (action: string): { bg: string; text: string; border: string } => {
    switch (action) {
      case 'DOCUMENT_PUBLISHED':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      case 'DOCUMENT_VERIFIED':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
      case 'DOCUMENT_REJECTED':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      case 'DOCUMENT_REINDEXED':
        return { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' };
      case 'GRIEVANCE_STATUS_CHANGED':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
      case 'GRIEVANCE_PRIORITY_CHANGED':
        return { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' };
      case 'GRIEVANCE_ASSIGNED':
        return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
      case 'GRIEVANCE_NOTE_ADDED':
        return { bg: '#f8fafc', text: '#334155', border: '#cbd5e1' };
      case 'KIOSK_STATUS_CHANGED':
        return { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' };
      case 'KIOSK_NOTE_UPDATED':
        return { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div className="page-container" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Operational Audit Trail
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={12} /> Append-Only Immutable
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
            Verifiable compliance log of all administrative actions across Knowledge, Grievances, and Kiosk fleets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              fontSize: '0.8125rem',
              color: '#64748b',
              padding: '0.375rem 0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Database size={14} color="#059669" />
            <span>Total Events: <strong>{totalRecords}</strong></span>
          </div>

          <button
            onClick={() => loadLogs()}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
            <Filter size={15} /> Filters:
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => handleActionChange(e.target.value)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="">All Actions</option>
            <option value="DOCUMENT_PUBLISHED">DOCUMENT_PUBLISHED</option>
            <option value="DOCUMENT_VERIFIED">DOCUMENT_VERIFIED</option>
            <option value="DOCUMENT_REJECTED">DOCUMENT_REJECTED</option>
            <option value="DOCUMENT_REINDEXED">DOCUMENT_REINDEXED</option>
            <option value="GRIEVANCE_STATUS_CHANGED">GRIEVANCE_STATUS_CHANGED</option>
            <option value="GRIEVANCE_PRIORITY_CHANGED">GRIEVANCE_PRIORITY_CHANGED</option>
            <option value="GRIEVANCE_ASSIGNED">GRIEVANCE_ASSIGNED</option>
            <option value="GRIEVANCE_NOTE_ADDED">GRIEVANCE_NOTE_ADDED</option>
            <option value="KIOSK_STATUS_CHANGED">KIOSK_STATUS_CHANGED</option>
            <option value="KIOSK_NOTE_UPDATED">KIOSK_NOTE_UPDATED</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={selectedEntityType}
            onChange={(e) => handleEntityTypeChange(e.target.value)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="">All Entity Types</option>
            <option value="knowledge_document">Knowledge Documents</option>
            <option value="grievance">Grievances</option>
            <option value="kiosk">Kiosks</option>
          </select>

          {(selectedAction || selectedEntityType || searchEntityId) && (
            <button
              onClick={() => {
                setSelectedAction('');
                setSelectedEntityType('');
                setSearchEntityId('');
                setCurrentPage(1);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Search Entity ID */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 'min(100%, 260px)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <input
              type="text"
              placeholder="Search Entity ID (e.g. GRV-2026-001)..."
              value={searchEntityId}
              onChange={(e) => setSearchEntityId(e.target.value)}
              style={{
                padding: '0.375rem 0.75rem 0.375rem 2rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0.375rem 0.75rem' }}>
            Search
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading immutable audit trail from Supabase PostgreSQL..." />
      ) : error ? (
        <ErrorState title="Failed to Load Audit Logs" message={error} onRetry={loadLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Audit Entries Found"
          description="There are no administrative audit events matching the selected filters. All operational actions will appear here in real-time."
          action={
            (selectedAction || selectedEntityType || searchEntityId) ? (
              <button
                onClick={() => {
                  setSelectedAction('');
                  setSelectedEntityType('');
                  setSearchEntityId('');
                  setCurrentPage(1);
                }}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.75rem' }}
              >
                Reset Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Entity</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Operator</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Details Summary</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item, idx) => {
                  const badge = getActionBadgeColor(item.action);
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        backgroundColor: isEven ? '#ffffff' : '#fafafa',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={13} color="#94a3b8" />
                          <span>{formatAuditDate(item.createdAt)}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.1875rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            {item.entityId}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                            {item.entityType.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <User size={13} color="#64748b" />
                          <div>
                            <span style={{ fontWeight: 500, color: '#334155' }}>{item.userName}</span>
                            <span
                              style={{
                                marginLeft: '0.375rem',
                                fontSize: '0.6875rem',
                                padding: '0.0625rem 0.375rem',
                                borderRadius: '3px',
                                backgroundColor: item.userRole === 'ADMIN' ? '#eff6ff' : '#f1f5f9',
                                color: item.userRole === 'ADMIN' ? '#1e40af' : '#475569',
                                fontWeight: 600,
                              }}
                            >
                              {item.userRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Details Summary */}
                      <td style={{ padding: '0.75rem 1rem', color: '#475569', maxWidth: '380px' }}>
                        {item.details && Object.keys(item.details).length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {Object.entries(item.details).slice(0, 3).map(([k, v]) => (
                              <span
                                key={k}
                                style={{
                                  fontSize: '0.6875rem',
                                  padding: '0.125rem 0.375rem',
                                  backgroundColor: '#f1f5f9',
                                  borderRadius: '3px',
                                  border: '1px solid #e2e8f0',
                                  color: '#334155',
                                }}
                              >
                                <strong>{k}:</strong> {String(v).slice(0, 40)}
                              </span>
                            ))}
                            {Object.keys(item.details).length > 3 && (
                              <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                                +{Object.keys(item.details).length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>

                      {/* Payload button */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              padding: '0.875rem 1rem',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Showing <strong>{logs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of{' '}
              <strong>{totalRecords}</strong> entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1 || loading}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span style={{ fontSize: '0.8125rem', padding: '0 0.5rem', color: '#475569' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages || loading}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Slide-over / Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              maxWidth: '640px',
              width: '100%',
              padding: '1.25rem',
              boxSizing: 'border-box',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                Audit Event Record
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.65rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.6875rem' }}>Event ID</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedLog.id}</span>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.6875rem' }}>Timestamp</span>
                <span style={{ fontWeight: 600 }}>{formatAuditDate(selectedLog.createdAt)}</span>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.6875rem' }}>Action</span>
                <span style={{ fontWeight: 600, color: '#0369a1' }}>{selectedLog.action}</span>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.6875rem' }}>Entity</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.entityType}:{selectedLog.entityId}</span>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.6875rem' }}>Operator Name</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.userName}</span>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.6875rem' }}>Role</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.userRole}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '0.375rem', fontWeight: 600 }}>
                Structured Event Details (Sanitized)
              </span>
              <pre
                style={{
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  fontFamily: 'Consolas, Monaco, monospace',
                  margin: 0,
                }}
              >
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
