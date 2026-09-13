import React, { useState } from 'react';
import { ArrowRight, Sparkles, Database, Users, HelpCircle, FileCheck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export const DifferentiatorBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f0f7ff 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: 'var(--radius-lg)',
        padding: '1.15rem',
        marginBottom: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: 'var(--sahkaar-teal)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', wordBreak: 'break-word', lineHeight: 1.25 }}>
              Operational Closed-Loop Intelligence Architecture
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '0.15rem' }}>
              Knowledge is the source of truth — not the AI model. Operations staff verify updates to ground future AI responses.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-secondary btn-sm"
          style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', whiteSpace: 'nowrap' }}
        >
          {isExpanded ? (
            <>Hide Closed-Loop Diagram <ChevronUp size={14} /></>
          ) : (
            <>View Closed-Loop Flow <ChevronDown size={14} /></>
          )}
        </button>
      </div>

      {isExpanded && (
        <div
          style={{
            marginTop: '1.15rem',
            paddingTop: '1.15rem',
            borderTop: '1px dashed #cbd5e1',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              minWidth: '680px',
              paddingBottom: '0.5rem',
            }}
          >
            <div
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--primary-700)', marginBottom: '0.25rem' }}>
                <Users size={18} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>1. Citizen</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--slate-500)' }}>Voice / Kiosk / Web</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)', flexShrink: 0 }}>
              <ArrowRight size={16} />
            </div>

            <div
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--trust-700)', marginBottom: '0.25rem' }}>
                <Sparkles size={18} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>2. SahkaarSetu AI</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--slate-500)' }}>Grounded RAG</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)', flexShrink: 0 }}>
              <ArrowRight size={16} />
            </div>

            <div
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid var(--accent-100)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--accent-700)', marginBottom: '0.25rem' }}>
                <HelpCircle size={18} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-700)' }}>3. Triage / Gap</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--slate-500)' }}>Unanswered Query</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)', flexShrink: 0 }}>
              <ArrowRight size={16} />
            </div>

            <div
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--primary-700)', marginBottom: '0.25rem' }}>
                <FileCheck size={18} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>4. Operations Staff</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--slate-500)' }}>Verify & Redress</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)', flexShrink: 0 }}>
              <ArrowRight size={16} />
            </div>

            <div
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--trust-700)', marginBottom: '0.25rem' }}>
                <Database size={18} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>5. Knowledge Base</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--slate-500)' }}>Re-indexed Source</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)', flexShrink: 0 }}>
              <ArrowRight size={16} />
            </div>

            <div
              style={{
                flex: 1,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ color: 'var(--primary-700)', marginBottom: '0.25rem' }}>
                <RefreshCw size={18} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-800)' }}>6. Better Answers</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--primary-700)' }}>Grounded Truth</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DifferentiatorBanner;
