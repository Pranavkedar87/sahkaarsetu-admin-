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
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: 'var(--primary-700)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              Operational Closed-Loop Intelligence Architecture
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)' }}>
              Knowledge is the source of truth — not the AI model. Operations staff verify updates to ground future AI responses.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-secondary btn-sm"
          style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
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
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px dashed #cbd5e1',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
              }}
            >
              <div style={{ color: 'var(--primary-700)', marginBottom: '0.25rem' }}>
                <Users size={20} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>1. Citizen</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Voice / Kiosk / Web</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)' }}>
              <ArrowRight size={18} />
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
              }}
            >
              <div style={{ color: 'var(--trust-700)', marginBottom: '0.25rem' }}>
                <Sparkles size={20} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>2. SahkaarSetu AI</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Grounded RAG assistance</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)' }}>
              <ArrowRight size={18} />
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--accent-100)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
              }}
            >
              <div style={{ color: 'var(--accent-700)', marginBottom: '0.25rem' }}>
                <HelpCircle size={20} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-700)' }}>3. Escalation / Gap</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Unanswered / Low confidence</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)' }}>
              <ArrowRight size={18} />
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
              }}
            >
              <div style={{ color: 'var(--primary-700)', marginBottom: '0.25rem' }}>
                <FileCheck size={20} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>4. Operations Staff</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Verify, resolve & upload</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)' }}>
              <ArrowRight size={18} />
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
              }}
            >
              <div style={{ color: 'var(--trust-700)', marginBottom: '0.25rem' }}>
                <Database size={20} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)' }}>5. Knowledge Base</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Re-indexed source of truth</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--slate-400)' }}>
              <ArrowRight size={18} />
            </div>

            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '0.75rem 0.5rem',
              }}
            >
              <div style={{ color: 'var(--primary-700)', marginBottom: '0.25rem' }}>
                <RefreshCw size={20} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-800)' }}>6. Better Answers</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-700)' }}>Zero model re-training</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
