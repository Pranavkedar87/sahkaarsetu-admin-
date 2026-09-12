import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Globe2,
  Monitor,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/FeedbackStates';
import { AdminTab, Role } from '../types';
import { getOperationsAnalytics, OperationsAnalytics } from '../services/api/analytics';

interface InsightsPageProps {
  onNavigate: (tab: AdminTab) => void;
  role: Role;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate, role }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<OperationsAnalytics | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await getOperationsAnalytics();
        setAnalytics(res);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading || !analytics) {
    return <LoadingState message="Aggregating operational analytics and knowledge gap metrics..." />;
  }

  const { timeline, categories, languages, knowledgeGaps, summary } = analytics;
  const maxQueries = Math.max(...timeline.map((t) => t.queries));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Operational Insights & Knowledge Gaps
            </h2>
            <Badge variant="demo">Telemetry Analytics</Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Understand citizen demand patterns, multilingual adoption, hardware usage, and identify missing knowledge documents.
          </p>
        </div>

        <button onClick={() => onNavigate('knowledge')} className="btn btn-primary btn-sm">
          <BookOpen size={14} /> Update Knowledge Base
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Assistance Queries
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            44,960
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-700)', fontWeight: 600 }}>↑ 18% vs last week</div>
        </div>

        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Voice Interactions
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: '0.25rem' }}>
            {summary.voiceQueriesShare}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Bhashini & Groq Whisper STT</div>
        </div>

        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Rural Kiosk Share
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--trust-700)', marginTop: '0.25rem' }}>
            {summary.kioskQueriesShare}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Direct PACS terminals</div>
        </div>

        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            AI Escalations
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-700)', marginTop: '0.25rem' }}>
            {summary.unresolvedEscalations}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-700)', fontWeight: 600 }}>Requiring staff review</div>
        </div>

        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Knowledge Gaps
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
            {summary.knowledgeGapsIdentified}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Targeted for ingestion</div>
        </div>
      </div>

      {/* 4 Core Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 1: Assistance Queries Over Time */}
        <Card
          title="Assistance Demand Over Time"
          subtitle="Daily queries split between voice interactions and rural PACS kiosks"
        >
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {timeline.map((point) => {
              const barWidth = Math.round((point.queries / maxQueries) * 100);
              return (
                <div key={point.date} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <span style={{ width: '50px', color: 'var(--slate-500)', fontWeight: 600 }}>{point.date}</span>
                  <div style={{ flex: 1, backgroundColor: 'var(--slate-100)', height: '22px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${(point.voiceQueries / point.queries) * barWidth}%`,
                        backgroundColor: 'var(--primary-600)',
                        height: '100%',
                      }}
                      title={`Voice: ${point.voiceQueries}`}
                    />
                    <div
                      style={{
                        width: `${(point.kioskQueries / point.queries) * barWidth}%`,
                        backgroundColor: 'var(--trust-600)',
                        height: '100%',
                      }}
                      title={`Kiosk: ${point.kioskQueries}`}
                    />
                  </div>
                  <span style={{ width: '60px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {point.queries.toLocaleString()}
                  </span>
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, backgroundColor: 'var(--primary-600)', borderRadius: '2px' }} /> Voice Queries
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, backgroundColor: 'var(--trust-600)', borderRadius: '2px' }} /> Kiosk Terminals
              </span>
            </div>
          </div>
        </Card>

        {/* Chart 2: Top Assistance Categories */}
        <Card
          title="Most Used Assistance Categories"
          subtitle="Distribution of farmer queries across cooperative domains"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {categories.map((cat) => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{cat.category}</span>
                  <span style={{ fontWeight: 700, color: 'var(--slate-600)' }}>
                    {cat.count.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--slate-100)', height: '10px', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${cat.percentage * 2}%`,
                      maxWidth: '100%',
                      backgroundColor: cat.color,
                      height: '100%',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chart 3: Language Usage Distribution */}
        <Card
          title="Multilingual Distribution"
          subtitle="Citizen vernacular preference across web, mobile, and kiosk"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {languages.map((lang) => (
              <div key={lang.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{lang.language}</span>
                  <span style={{ fontWeight: 700, color: 'var(--slate-600)' }}>
                    {lang.count.toLocaleString()} ({lang.percentage}%)
                  </span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--slate-100)', height: '10px', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color,
                      height: '100%',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section: Closed-Loop Knowledge Gap Resolution (Requirement 7) */}
        <Card
          title="Identified Knowledge Gaps (AI Escalations)"
          subtitle="Queries where the AI had low confidence due to missing or local by-laws"
          action={
            <Badge variant="warning">{knowledgeGaps.length} Action Items</Badge>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
            {knowledgeGaps.map((gap) => (
              <div
                key={gap.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-900)' }}>
                      {gap.topic}
                    </span>
                    <Badge variant={gap.severity === 'high' ? 'danger' : 'warning'}>
                      {gap.severity} severity
                    </Badge>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                    {gap.frequency} citizen queries
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--slate-700)' }}>
                    <Lightbulb size={14} style={{ color: 'var(--warning-700)' }} />
                    <span><strong>Recommended Action:</strong> {gap.recommendedAction}</span>
                  </div>

                  <button
                    onClick={() => onNavigate('knowledge')}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                  >
                    Upload Document <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
