import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
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

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<OperationsAnalytics | null>(null);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const data = await getOperationsAnalytics(period);
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load operations analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [period]);

  if (loading || !analytics) {
    return <LoadingState message="Aggregating empirical telemetry from Supabase messages and grievance state..." />;
  }

  const { summary, timeline, categories, languages, knowledgeGaps } = analytics;
  const maxQueries = Math.max(...timeline.map((t) => t.queries), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Operational Analytics & Insights
            </h2>
            <Badge variant="live" icon={<span className="pulse-dot" />}>
              Supabase Live
            </Badge>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Empirical demand patterns, multilingual adoption, and closed-loop knowledge gap identification from Supabase PostgreSQL.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Period Selector */}
          <div style={{ display: 'flex', backgroundColor: 'var(--slate-100)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-color)' }}>
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: period === p ? '#ffffff' : 'transparent',
                  color: period === p ? 'var(--sahkaar-teal)' : 'var(--slate-600)',
                  boxShadow: period === p ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <button onClick={() => onNavigate('knowledge')} className="btn btn-primary btn-sm">
            <BookOpen size={14} /> Update Knowledge Base
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '0.85rem' }}>
        {/* Metric 1: Total Queries */}
        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Citizen Queries
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {summary.totalQueries.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            {summary.thisMonthQueries} in 30d • {summary.todayQueries} today
          </div>
        </div>

        {/* Metric 2: Voice Channel Telemetry */}
        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Voice Interactions
            </span>
            <Badge variant="neutral">Not Tracked</Badge>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-400)', marginTop: '0.25rem' }}>
            N/A
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }} title={analytics.channelTelemetry.reason}>
            Channel mode not in message schema
          </div>
        </div>

        {/* Metric 3: Kiosk Channel Telemetry */}
        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Rural Kiosk Share
            </span>
            <Badge variant="neutral">Not Tracked</Badge>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-400)', marginTop: '0.25rem' }}>
            N/A
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }} title={analytics.channelTelemetry.reason}>
            Hardware source ID not captured
          </div>
        </div>

        {/* Metric 4: AI Escalations */}
        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Active Triage Cases
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-700)', marginTop: '0.25rem' }}>
            {summary.unresolvedEscalations}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-700)', fontWeight: 600 }}>
            Under staff review
          </div>
        </div>

        {/* Metric 5: Knowledge Gaps */}
        <div style={{ padding: '1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Knowledge Gaps
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
            {summary.knowledgeGapsIdentified}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Targeted for ingestion</div>
        </div>
      </div>

      {/* 4 Core Charts */}
      <div className="responsive-grid-mid">
        {/* Chart 1: Assistance Queries Over Time */}
        <Card
          title="Assistance Demand Over Time"
          subtitle={`Query volume per ${period === '24h' ? 'hour' : 'day'} from Supabase messages table`}
        >
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {timeline.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                No citizen queries recorded in this time window.
              </div>
            ) : (
              timeline.map((point) => {
                const barWidth = Math.max(Math.round((point.queries / maxQueries) * 100), point.queries > 0 ? 3 : 0);
                return (
                  <div key={point.date} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ width: period === '24h' ? '45px' : '55px', color: 'var(--slate-500)', fontWeight: 600, fontSize: '0.75rem' }}>
                      {point.date}
                    </span>
                    <div style={{ flex: 1, backgroundColor: 'var(--slate-100)', height: '20px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                      <div
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: 'var(--sahkaar-teal)',
                          height: '100%',
                          transition: 'width 0.3s ease',
                        }}
                        title={`Queries: ${point.queries}`}
                      />
                    </div>
                    <span style={{ width: '45px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {point.queries}
                    </span>
                  </div>
                );
              })
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--slate-50)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--slate-600)' }}>
              <Info size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
              <span>
                <strong>Telemetry Notice:</strong> Total queries are derived from the live database. Voice STT vs Touch breakdown is not stored in the current message schema.
              </span>
            </div>
          </div>
        </Card>

        {/* Chart 2: Top Assistance Categories */}
        <Card
          title="Most Used Assistance Categories"
          subtitle="Distribution of citizen inquiries across cooperative domains from LLM intent classification"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {categories.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                No intent data available.
              </div>
            ) : (
              categories.map((cat) => (
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
                        width: `${Math.min(cat.percentage * 2, 100)}%`,
                        backgroundColor: cat.color,
                        height: '100%',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Chart 3: Language Usage Distribution */}
        <Card
          title="Multilingual Distribution"
          subtitle="Citizen vernacular preference captured across user messages"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {languages.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                No language records available.
              </div>
            ) : (
              languages.map((lang) => (
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
              ))
            )}
          </div>
        </Card>

        {/* Section: Closed-Loop Knowledge Gap Resolution */}
        <Card
          title="Identified Knowledge Gaps (AI Escalations)"
          subtitle="Derived from query intent patterns lacking dedicated official published documentation"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.65rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--slate-700)', minWidth: 0, flex: 1 }}>
                    <Lightbulb size={14} style={{ color: 'var(--warning-700)', flexShrink: 0 }} />
                    <span style={{ wordBreak: 'break-word' }}><strong>Recommended:</strong> {gap.recommendedAction}</span>
                  </div>

                  <button
                    onClick={() => onNavigate('knowledge')}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.725rem', whiteSpace: 'nowrap' }}
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

export default InsightsPage;
