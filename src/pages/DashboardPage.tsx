import React, { useState, useEffect } from 'react';
import {
  Monitor, BookOpen, AlertCircle, BarChart3, CheckCircle2,
  AlertTriangle, Clock, ArrowRight, Activity, Layers, FileText,
  Users, ShieldCheck, Zap
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { AdminTab, Role, SystemHealthData, KioskItem, KnowledgeDoc, GrievanceRecord, NotificationItem } from '../types';
import { getKiosksList } from '../services/api/kiosks';
import { getKnowledgeDocuments } from '../services/api/knowledge';
import { getGrievanceList } from '../services/api/grievances';
import { getOperationsAnalytics, OperationsAnalytics } from '../services/api/analytics';
import { getNotifications } from '../services/api/notifications';
import { fetchAuditLogs } from '../services/api/audit';

interface DashboardPageProps {
  onNavigate: (tab: AdminTab) => void;
  role: Role;
  systemHealth: SystemHealthData;
}

// Skeleton Loader Component
const Skeleton = ({ height = '100px', width = '100%', borderRadius = '8px' }: { height?: string, width?: string, borderRadius?: string }) => (
  <div style={{
    height, width, borderRadius,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear'
  }} />
);

const ErrorState = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--slate-50)', borderRadius: '8px', border: '1px dashed var(--slate-300)' }}>
    <AlertCircle size={24} style={{ color: 'var(--slate-400)', margin: '0 auto 0.5rem' }} />
    <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '0.5rem' }}>{message}</div>
    <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Retry</button>
  </div>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, role, systemHealth }) => {
  const [kiosks, setKiosks] = useState<{ data: KioskItem[] | null, error: boolean, loading: boolean }>({ data: null, error: false, loading: true });
  const [docs, setDocs] = useState<{ data: KnowledgeDoc[] | null, error: boolean, loading: boolean }>({ data: null, error: false, loading: true });
  const [grievances, setGrievances] = useState<{ data: GrievanceRecord[] | null, error: boolean, loading: boolean }>({ data: null, error: false, loading: true });
  const [analytics, setAnalytics] = useState<{ data: OperationsAnalytics | null, error: boolean, loading: boolean }>({ data: null, error: false, loading: true });
  const [notifications, setNotifications] = useState<{ data: NotificationItem[] | null, error: boolean, loading: boolean }>({ data: null, error: false, loading: true });
  const [auditLogs, setAuditLogs] = useState<{ data: any[] | null, error: boolean, loading: boolean }>({ data: null, error: false, loading: true });

  const loadKiosks = () => {
    setKiosks(prev => ({ ...prev, error: false, loading: true }));
    getKiosksList().then(res => setKiosks({ data: res.kiosks, error: false, loading: false })).catch(() => setKiosks({ data: null, error: true, loading: false }));
  };
  const loadDocs = () => {
    setDocs(prev => ({ ...prev, error: false, loading: true }));
    getKnowledgeDocuments().then(res => setDocs({ data: res.docs, error: false, loading: false })).catch(() => setDocs({ data: null, error: true, loading: false }));
  };
  const loadGrievances = () => {
    setGrievances(prev => ({ ...prev, error: false, loading: true }));
    getGrievanceList().then(res => setGrievances({ data: res.grievances, error: false, loading: false })).catch(() => setGrievances({ data: null, error: true, loading: false }));
  };
  const loadAnalytics = () => {
    setAnalytics(prev => ({ ...prev, error: false, loading: true }));
    getOperationsAnalytics().then(res => setAnalytics({ data: res, error: false, loading: false })).catch(() => setAnalytics({ data: null, error: true, loading: false }));
  };
  const loadNotifications = () => {
    setNotifications(prev => ({ ...prev, error: false, loading: true }));
    getNotifications().then(res => setNotifications({ data: res.notifications, error: false, loading: false })).catch(() => setNotifications({ data: null, error: true, loading: false }));
  };
  const loadAuditLogs = () => {
    setAuditLogs(prev => ({ ...prev, error: false, loading: true }));
    fetchAuditLogs({ pageSize: 5 }).then(res => setAuditLogs({ data: res.items, error: res.status === 'error', loading: false })).catch(() => setAuditLogs({ data: null, error: true, loading: false }));
  };

  useEffect(() => {
    loadKiosks();
    loadDocs();
    loadGrievances();
    loadAnalytics();
    loadNotifications();
    loadAuditLogs();
    
    if (!document.getElementById('shimmer-style')) {
      const style = document.createElement('style');
      style.id = 'shimmer-style';
      style.innerHTML = `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
      document.head.appendChild(style);
    }
  }, []);

  const totalKiosks = kiosks.data?.length || 0;
  const onlineKiosks = kiosks.data?.filter(k => k.status === 'online').length || 0;
  const totalDocs = docs.data?.length || 0;
  const reviewsDue = docs.data?.filter(d => d.status === 'Review Due' || d.status === 'Under Review').length || 0;
  const newGrievances = grievances.data?.filter(g => g.status === 'New').length || 0;
  const totalGrievances = grievances.data?.length || 0;
  const queryVolume = analytics.data?.summary?.thisMonthQueries || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>SAHAKARSETU OPERATIONS CENTER</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>Monitor cooperative services, knowledge, grievances and kiosk operations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {systemHealth.isBackendConnected ? (
             <><CheckCircle2 size={18} style={{ color: 'var(--success-600)' }} /><span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)' }}>Systems Operational</span></>
          ) : (
             <><AlertCircle size={18} style={{ color: 'var(--danger-600)' }} /><span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)' }}>Backend Disconnected</span></>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate('kiosks')} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}><Monitor size={16} /> Manage Kiosks</button>
        <button onClick={() => onNavigate('knowledge')} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}><BookOpen size={16} /> Review Knowledge</button>
        <button onClick={() => onNavigate('grievances')} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}><AlertCircle size={16} /> Grievances</button>
        <button onClick={() => onNavigate('insights')} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem' }}><BarChart3 size={16} /> View Insights</button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'ACTIVE KIOSKS', val: kiosks.loading ? -1 : totalKiosks, icon: Monitor, color: 'var(--trust-600)', sub: `${onlineKiosks} Online now` },
          { label: 'GRIEVANCES', val: grievances.loading ? -1 : totalGrievances, icon: Users, color: 'var(--accent-600)', sub: `${newGrievances} New cases` },
          { label: 'KNOWLEDGE DOCS', val: docs.loading ? -1 : totalDocs, icon: FileText, color: 'var(--primary-600)', sub: `Verified sources` },
          { label: 'REVIEWS DUE', val: docs.loading ? -1 : reviewsDue, icon: ShieldCheck, color: 'var(--warning-600)', sub: `Action required` },
          { label: 'ASSISTANCE VOLUME', val: analytics.loading ? -1 : queryVolume, icon: Zap, color: 'var(--success-600)', sub: `30-Day total` }
        ].map((kpi, idx) => (
          <Card key={idx} >
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', letterSpacing: '0.05em' }}>{kpi.label}</div>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
              {kpi.val === -1 ? (
                <div style={{ marginTop: '0.75rem' }}><Skeleton height="36px" width="60px" /></div>
              ) : (
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>{kpi.val}</div>
              )}
              {kpi.val === -1 ? (
                <div style={{ marginTop: '0.5rem' }}><Skeleton height="16px" width="80px" /></div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>{kpi.sub}</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Row 2: Kiosks & Knowledge */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
        <Card title="Kiosk Fleet Operations">
          {kiosks.loading ? <Skeleton height="150px" /> : kiosks.error ? <ErrorState message="Unable to load kiosk data." onRetry={loadKiosks} /> : (
            <div>
               <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                 <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: 'var(--trust-50)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--trust-700)' }}>{onlineKiosks}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--trust-600)' }}>ONLINE</div>
                 </div>
                 <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: 'var(--warning-50)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning-700)' }}>{kiosks.data!.filter(k => k.status === 'maintenance').length}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning-600)' }}>MAINTENANCE</div>
                 </div>
                 <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: 'var(--danger-50)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger-700)' }}>{kiosks.data!.filter(k => k.status === 'offline').length}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger-600)' }}>OFFLINE</div>
                 </div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {kiosks.data!.length === 0 ? <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>No kiosks registered.</div> : 
                   kiosks.data!.slice(0, 4).map(k => (
                     <div key={k.id} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: k.status === 'online' ? 'var(--success-600)' : k.status === 'maintenance' ? 'var(--warning-600)' : 'var(--danger-600)' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                           <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{k.status}</span>
                        </div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.7rem', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>PACS: {k.pacsName}</div>
                     </div>
                  ))}
               </div>
            </div>
          )}
        </Card>

        <Card title="Knowledge Governance Lifecycle">
          {docs.loading ? <Skeleton height="150px" /> : docs.error ? <ErrorState message="Unable to load knowledge documents." onRetry={loadDocs} /> : (
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                 {[
                   { label: 'DRAFT', count: docs.data!.filter(d => d.status === 'Draft').length, color: 'var(--slate-500)' },
                   { label: 'REVIEW', count: docs.data!.filter(d => d.status === 'Review Due' || d.status === 'Under Review').length, color: 'var(--warning-600)' },
                   { label: 'VERIFIED', count: docs.data!.filter(d => d.status === 'Verified').length, color: 'var(--primary-600)' },
                   { label: 'PUBLISHED', count: docs.data!.filter(d => d.status === 'Published').length, color: 'var(--success-600)' }
                 ].map((stage, idx, arr) => (
                   <React.Fragment key={stage.label}>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--slate-50)', border: `2px solid ${stage.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: stage.color }}>
                         {stage.count}
                       </div>
                       <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-500)' }}>{stage.label}</div>
                     </div>
                     {idx < arr.length - 1 && <ArrowRight size={16} style={{ color: 'var(--slate-300)', marginTop: '-1rem' }} />}
                   </React.Fragment>
                 ))}
               </div>
               <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '6px' }}>
                 {docs.data!.length === 0 ? "No knowledge documents governed." : `Total of ${docs.data!.length} documents currently tracked in the system. ${reviewsDue > 0 ? reviewsDue + ' require attention.' : 'All reviews are up to date.'}`}
               </div>
            </div>
          )}
        </Card>
      </div>

      {/* Row 3: Grievances & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
        <Card title="Grievance Operations">
          {grievances.loading ? <Skeleton height="200px" /> : grievances.error ? <ErrorState message="Unable to load grievances." onRetry={loadGrievances} /> : (
            <div>
               <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                 {['New', 'In Progress', 'Resolved'].map(st => {
                   const count = grievances.data!.filter(g => g.status === st || (st === 'In Progress' && (g.status === 'Assigned' || g.status === 'Escalated'))).length;
                   const pct = totalGrievances === 0 ? (st === 'Resolved' ? 100 : 0) : Math.round((count / totalGrievances) * 100);
                   const color = st === 'New' ? 'var(--danger-500)' : st === 'In Progress' ? 'var(--warning-500)' : 'var(--success-500)';
                   return (
                     <div key={st} style={{ flex: pct || 1, height: '8px', background: color, borderRadius: '4px', opacity: pct === 0 ? 0.1 : 1 }} title={`${st}: ${count}`} />
                   );
                 })}
               </div>
               
               <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.75rem' }}>Recent Grievances</div>
               {grievances.data!.length === 0 ? (
                 <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>All current grievances are resolved or none are active.</div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                   {grievances.data!.slice(0, 3).map(g => (
                     <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                       <div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-800)' }}>{g.id.slice(0, 8).toUpperCase()}</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{g.category} • {g.pacsName}</div>
                       </div>
                       <Badge variant={g.status === 'New' ? 'danger' : g.status === 'Resolved' ? 'success' : 'warning'}>{g.status}</Badge>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </Card>

        <Card title="Assistance Activity">
          {analytics.loading ? <Skeleton height="200px" /> : analytics.error ? <ErrorState message="Unable to load analytics telemetry." onRetry={loadAnalytics} /> : (
            <div>
              {!analytics.data?.summary || analytics.data.summary.thisMonthQueries === 0 ? (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>No assistance queries recorded for the selected period.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                     <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '0.5rem' }}>INTENT DISTRIBUTION</div>
                     {analytics.data.categories.map(idist => (
                       <div key={idist.category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                         <div style={{ width: '80px', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idist.category}</div>
                         <div style={{ flex: 1, height: '6px', background: 'var(--slate-100)', borderRadius: '3px', overflow: 'hidden' }}>
                           <div style={{ width: `${(idist.count / analytics.data!.summary.thisMonthQueries) * 100}%`, height: '100%', background: 'var(--trust-500)' }} />
                         </div>
                         <div style={{ width: '30px', fontSize: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{idist.count}</div>
                       </div>
                     ))}
                  </div>
                  <div>
                     <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '0.5rem' }}>LANGUAGE DISTRIBUTION</div>
                     <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                       {analytics.data.languages.map(ld => (
                         <div key={ld.language} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                           <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-500)' }} />
                           <span style={{ fontSize: '0.8rem', color: 'var(--slate-700)' }}>{ld.language} ({ld.count})</span>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Row 4: Attention & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
        <Card title="Needs Attention">
          {notifications.loading ? <Skeleton height="200px" /> : notifications.error ? <ErrorState message="Unable to load notifications." onRetry={loadNotifications} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.data!.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--slate-50)', borderRadius: '8px', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--success-600)', margin: '0 auto 0.5rem' }} />
                  <div>All monitored operations are currently within normal state.</div>
                </div>
              ) : (
                notifications.data!.slice(0, 4).map(item => {
                  const isCritical = item.severity === 'critical';
                  const isHigh = item.severity === 'high';
                  const iconColor = isCritical ? 'var(--danger-600)' : isHigh ? 'var(--warning-600)' : 'var(--trust-600)';
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                      <AlertTriangle size={18} style={{ color: iconColor, marginTop: '0.1rem', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-800)' }}>{item.title}</div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '0.15rem' }}>{item.message}</p>
                      </div>
                      <button onClick={() => onNavigate(item.linkTab)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Action &rarr;</button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Card>

        <Card title="Recent Activity">
          {auditLogs.loading ? <Skeleton height="200px" /> : auditLogs.error ? <ErrorState message="Unable to load recent activity." onRetry={loadAuditLogs} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {auditLogs.data!.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>No recent activity recorded.</div>
              ) : (
                auditLogs.data!.map((log: any) => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--slate-300)', marginTop: '0.4rem', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--slate-800)', wordBreak: 'break-word' }}>
                        <span style={{ fontWeight: 600 }}>{log.userName}</span> performed <span style={{ fontWeight: 600 }}>{log.action}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
      
    </div>
  );
};

export default DashboardPage;
