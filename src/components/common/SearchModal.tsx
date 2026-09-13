import React, { useState } from 'react';
import { Search, Monitor, BookOpen, AlertCircle, Building2, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { AdminTab } from '../../types';
import { DEMO_KIOSKS, DEMO_KNOWLEDGE_DOCS, DEMO_GRIEVANCES } from '../../data/demo';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: AdminTab) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const filteredKiosks = q
    ? DEMO_KIOSKS.filter(
        (k) =>
          k.id.toLowerCase().includes(q) ||
          k.name.toLowerCase().includes(q) ||
          k.location.toLowerCase().includes(q) ||
          k.pacsName.toLowerCase().includes(q)
      )
    : [];

  const filteredDocs = q
    ? DEMO_KNOWLEDGE_DOCS.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.documentType.toLowerCase().includes(q) ||
          d.sourceName.toLowerCase().includes(q) ||
          (d.scheme && d.scheme.toLowerCase().includes(q))
      )
    : [];

  const filteredGrievances = q
    ? DEMO_GRIEVANCES.filter(
        (g) =>
          g.id.toLowerCase().includes(q) ||
          g.citizenMaskedName.toLowerCase().includes(q) ||
          g.pacsName.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.citizenQuery.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    filteredKiosks.length > 0 || filteredDocs.length > 0 || filteredGrievances.length > 0;

  const handleSelect = (tab: AdminTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Operations Search"
      subtitle="Search across kiosks, official knowledge documents, PACS societies, and grievances"
      maxWidth="620px"
    >
      <div style={{ position: 'relative' }}>
        <Search
          size={18}
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Kiosk ID, PACS name, scheme, document, or citizen query..."
          className="form-input"
          style={{ paddingLeft: '2.5rem', fontSize: '0.95rem' }}
          autoFocus
        />
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '380px', overflowY: 'auto' }}>
        {!q && (
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', textAlign: 'center', padding: '1.5rem 0' }}>
            Type a query to search across deployed Kiosks, Knowledge Documents, and Grievance cases.
          </p>
        )}

        {q && !hasResults && (
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', textAlign: 'center', padding: '1.5rem 0' }}>
            No records matched "{query}". Try searching for "Nashik", "PMFBY", "By-laws", or "KSK".
          </p>
        )}

        {filteredKiosks.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Kiosks & Hardware ({filteredKiosks.length})
            </div>
            {filteredKiosks.slice(0, 3).map((k) => (
              <div
                key={k.id}
                onClick={() => handleSelect('kiosks')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  marginBottom: '0.4rem',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Monitor size={16} style={{ color: 'var(--primary-700)' }} />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{k.id}</span> — {k.name}
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{k.pacsName} • {k.location}</div>
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--slate-400)' }} />
              </div>
            ))}
          </div>
        )}

        {filteredDocs.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Knowledge Base Documents ({filteredDocs.length})
            </div>
            {filteredDocs.slice(0, 3).map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelect('knowledge')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  marginBottom: '0.4rem',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <BookOpen size={16} style={{ color: 'var(--trust-700)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{d.documentType} • {d.version} • {d.sourceName}</div>
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--slate-400)' }} />
              </div>
            ))}
          </div>
        )}

        {filteredGrievances.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Grievance Cases ({filteredGrievances.length})
            </div>
            {filteredGrievances.slice(0, 3).map((g) => (
              <div
                key={g.id}
                onClick={() => handleSelect('grievances')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  marginBottom: '0.4rem',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <AlertCircle size={16} style={{ color: 'var(--accent-700)' }} />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{g.id}</span> — {g.category} ({g.citizenMaskedName})
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', maxWidth: 'min(360px, 65vw)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.citizenQuery}
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--slate-400)' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
