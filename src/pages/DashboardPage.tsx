import React, { useState, useEffect } from 'react';
import {
  Monitor,
  BookOpen,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Server,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { DifferentiatorBanner } from '../components/common/DifferentiatorBanner';
import { LoadingState } from '../components/common/FeedbackStates';
import { AdminTab, Role, SystemHealthData, KioskItem, KnowledgeDoc, GrievanceRecord } from '../types';
import { getKiosksList } from '../services/api/kiosks';
import { getKnowledgeDocuments } from '../services/api/knowledge';
import { getGrievanceList } from '../services/api/grievances';
import { getOperationsAnalytics, OperationsAnalytics } from '../services/api/analytics';
import { getNotifications } from '../services/api/notifications';
import { NotificationItem } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: AdminTab) => void;
  role: Role;
  systemHealth: SystemHealthData;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, role, systemHealth }) => {
  const [loading, setLoading] = useState(true);
  const [kiosks, setKiosks] = useState<KioskItem[]>([]);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [analytics, setAnalytics] = useState<OperationsAnalytics | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [kioskRes, docRes, grvRes, analyticsRes, notifRes] = await Promise.all([
          getKiosksList(),
          getKnowledgeDocuments(),
          getGrievanceList(),
          getOperationsAnalytics(),
          getNotifications(),
        ]);
        setKiosks(kioskRes.kiosks);
        setDocs(docRes.docs);
        setGrievances(grvRes.grievances);
        setAnalytics(analyticsRes);
        setNotifications(notifRes.notifications);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Connecting to SahkaarSetu operations backend and telemetry data..." />;
  }

  // Kiosk calculations
  const totalKiosks = kiosks.length;
  const onlineKiosks = kiosks.filter((k) => k.status === 'online').length;
  const offlineKiosks = kiosks.filter((k) => k.status === 'offline').length;
  const maintenanceKiosks = kiosks.filter((k) => k.status === 'maintenance').length;

  // Knowledge calculations
  const totalDocs = docs.length;
  const publishedDocs = docs.filter((d) => d.status === 'Published' || d.status === 'Verified').length;
  const reviewDueDocs = docs.filter((d) => d.status === 'Review Due' || d.status === 'Under Review').length;
  const outdatedDocs = docs.filter((d) => d.status === 'Outdated').length;

  // Grievances calculations
  const totalGrievances = grievances.length;
  const newGrievances = grievances.filter((g) => g.status === 'New').length;
  const inProgressGrievances = grievances.filter((g) => g.status === 'In Progress' || g.status === 'Assigned' || g.status === 'Escalated').length;
  const resolvedGrievances = grievances.filter((g) => g.status === 'Resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Closed Loop Architecture Banner */}
      <DifferentiatorBanner />

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Operations Overview
            </h2>
            <Badge variant="live" icon={<span className="pulse-dot" />}>
              Live Monitoring
            </Badge>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Multi-taluka kiosk telemetry, verified knowledge lifecycle, and cooperative grievance resolution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('knowledge')} className="btn btn-outline-primary btn-sm">
            <BookOpen size={14} /> Knowledge Desk
          </button>
          <button onClick={() => onNavigate('kiosks')} className="btn btn-primary btn-sm">
            <Monitor size={14} /> Kiosks ({onlineKiosks}/{totalKiosks} Online)
          </button>
        </div>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="responsive-grid-pillars">
        {/* Card 1: Kiosks Health */}
        <Card
          title="Kiosks Fleet Health"
          badge={<Badge variant={offlineKiosks > 0 ? 'warning' : 'success'}>{onlineKiosks}/{totalKiosks} Active</Badge>}
          action={
            <button onClick={() => onNavigate('kiosks')} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
              Manage <ArrowRight size={12} />
            </button>
          }
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
            {onlineKiosks} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-500)' }}>online of {totalKiosks}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
            Deployed across Primary Agricultural Credit Societies (PACS).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--success-50)', borderRadius: '6px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-700)' }}>{onlineKiosks}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--success-700)', fontWeight: 600 }}>ONLINE</div>
            </div>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--warning-50)', borderRadius: '6px', border: '1px solid #fef3c7' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning-700)' }}>{maintenanceKiosks}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--warning-700)', fontWeight: 600 }}>MAINTENANCE</div>
            </div>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--danger-50)', borderRadius: '6px', border: '1px solid #fee2e2' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger-700)' }}>{offlineKiosks}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--danger-700)', fontWeight: 600 }}>OFFLINE</div>
            </div>
          </div>
        </Card>

        {/* Card 2: Knowledge Base Status */}
        <Card
          title="Knowledge Source of Truth"
          badge={<Badge variant={reviewDueDocs > 0 ? 'warning' : 'success'}>{reviewDueDocs} Review Due</Badge>}
          action={
            <button onClick={() => onNavigate('knowledge')} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
              Review <ArrowRight size={12} />
            </button>
          }
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
            {publishedDocs} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-500)' }}>verified of {totalDocs}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
            Official by-laws, schemes & circulars grounding the AI.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--trust-50)', borderRadius: '6px', border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--trust-700)' }}>{publishedDocs}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--trust-700)', fontWeight: 600 }}>VERIFIED</div>
            </div>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--warning-50)', borderRadius: '6px', border: '1px solid #fef3c7' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning-700)' }}>{reviewDueDocs}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--warning-700)', fontWeight: 600 }}>NEEDS REVIEW</div>
            </div>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--slate-100)', borderRadius: '6px', border: '1px solid var(--slate-200)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-600)' }}>{outdatedDocs}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--slate-600)', fontWeight: 600 }}>OUTDATED</div>
            </div>
          </div>
        </Card>

        {/* Card 3: Grievance Redressal */}
        <Card
          title="Grievance Redressal"
          badge={<Badge variant={newGrievances > 0 ? 'danger' : 'neutral'}>{newGrievances} New Cases</Badge>}
          action={
            <button onClick={() => onNavigate('grievances')} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
              Cases <ArrowRight size={12} />
            </button>
          }
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
            {inProgressGrievances} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-500)' }}>active cases</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
            Citizen disputes and PACS service complaints.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--danger-50)', borderRadius: '6px', border: '1px solid #fee2e2' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger-700)' }}>{newGrievances}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--danger-700)', fontWeight: 600 }}>UNASSIGNED</div>
            </div>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--trust-50)', borderRadius: '6px', border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--trust-700)' }}>{inProgressGrievances}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--trust-700)', fontWeight: 600 }}>IN PROGRESS</div>
            </div>
            <div style={{ padding: '0.5rem 0.25rem', background: 'var(--success-50)', borderRadius: '6px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-700)' }}>{resolvedGrievances}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--success-700)', fontWeight: 600 }}>RESOLVED</div>
            </div>
          </div>
        </Card>

        {/* Card 4: AI & Assistance Telemetry */}
        <Card
          title="Assistance Volume"
          badge={<Badge variant="info">{analytics?.summary ? `${analytics.summary.totalQueries.toLocaleString()} Queries` : 'Live Telemetry'}</Badge>}
          action={
            <button onClick={() => onNavigate('insights')} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
              Insights <ArrowRight size={12} />
            </button>
          }
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
            {analytics?.summary ? analytics.summary.todayQueries.toLocaleString() : '0'}{' '}
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-500)' }}>queries today</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
            Multilingual citizen inquiries in Marathi, Hindi & English.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
            <div style={{ padding: '0.5rem', background: 'var(--primary-50)', borderRadius: '6px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                {analytics?.summary ? analytics.summary.thisMonthQueries.toLocaleString() : '0'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary-700)', fontWeight: 600 }}>30-DAY VOLUME</div>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--accent-50)', borderRadius: '6px', border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-700)' }}>
                {analytics?.summary ? analytics.summary.unresolvedEscalations : '0'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-700)', fontWeight: 600 }}>ACTIVE CASES</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mid-Row: Attention Items & Real-Time Telemetry */}
      <div className="responsive-grid-mid">
        {/* Attention Items Feed */}
        <Card
          title="Immediate Operational Attention Required"
          subtitle="Items requiring staff intervention to maintain trustworthy citizen services"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--slate-500)',
                  fontSize: '0.85rem',
                }}
              >
                <CheckCircle2 size={24} style={{ color: 'var(--success-600)', margin: '0 auto 0.5rem' }} />
                <div>All systems operating normally. No immediate attention items required.</div>
              </div>
            ) : (
              notifications.slice(0, 3).map((item) => {
                const isCritical = item.severity === 'critical';
                const isHigh = item.severity === 'high';
                const bg = isCritical ? 'var(--danger-50)' : isHigh ? 'var(--warning-50)' : 'var(--trust-50)';
                const border = isCritical ? '#fecaca' : isHigh ? '#fde68a' : '#bfdbfe';
                const iconColor = isCritical ? 'var(--danger-700)' : isHigh ? 'var(--warning-700)' : 'var(--trust-700)';

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: bg,
                      borderRadius: '8px',
                      border: `1px solid ${border}`,
                    }}
                  >
                    {item.category === 'kiosks' ? (
                      <Monitor size={18} style={{ color: iconColor, marginTop: '0.15rem', flexShrink: 0 }} />
                    ) : item.category === 'knowledge' ? (
                      <BookOpen size={18} style={{ color: iconColor, marginTop: '0.15rem', flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={18} style={{ color: iconColor, marginTop: '0.15rem', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: iconColor }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{item.timestamp}</span>
                      </div>
                      <p style={{ fontSize: '0.775rem', color: 'var(--slate-700)', marginTop: '0.2rem', wordBreak: 'break-word' }}>
                        {item.message}
                      </p>
                      <button
                        onClick={() => onNavigate(item.linkTab)}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '0.5rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Take Action
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Backend & Diagnostics Information */}
        <Card
          title="Backend Infrastructure & AI Grounding"
          subtitle="Single shared FastAPI backend connecting citizen frontend and operations"
          badge={
            <Badge variant={systemHealth.isBackendConnected ? 'live' : 'warning'}>
              {systemHealth.isBackendConnected ? 'FastAPI Connected' : 'Demo Mode'}
            </Badge>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--slate-500)' }}>Service URL:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--slate-500)' }}>AI Generation Provider:</span>
              <span style={{ fontWeight: 600, color: 'var(--trust-700)' }}>
                {systemHealth.aiProvider} ({systemHealth.model})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--slate-500)' }}>Vector Embedding Model:</span>
              <span style={{ fontWeight: 600 }}>
                {systemHealth.embeddingModel} (768 dimensions)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--slate-500)' }}>Database & Vector Store:</span>
              <span style={{ fontWeight: 600 }}>
                Supabase PostgreSQL + pgvector
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', padding: '0.5rem 0' }}>
              <span style={{ color: 'var(--slate-500)' }}>Last Health Check:</span>
              <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>
                {systemHealth.checkedAt}
              </span>
            </div>

            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'var(--slate-50)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--slate-600)',
                lineHeight: 1.4,
              }}
            >
              🛡️ <strong>Safety Guarantee:</strong> All operational data routes through the single FastAPI API. No browser direct access to Supabase service-role keys or Gemini credentials.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
