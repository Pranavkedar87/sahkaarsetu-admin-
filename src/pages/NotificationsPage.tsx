import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  Monitor,
  BookOpen,
  AlertCircle,
  CheckCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { LoadingState, EmptyState } from '../components/common/FeedbackStates';
import { NotificationItem, AdminTab, Role } from '../types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api/notifications';

interface NotificationsPageProps {
  onNavigate: (tab: AdminTab) => void;
  role: Role;
  onRefreshBadge: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onNavigate,
  onRefreshBadge,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchNotifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to notification streams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      onRefreshBadge();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onRefreshBadge();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const filteredNotifs = notifications.filter(
    (n) => categoryFilter === 'all' || n.category === categoryFilter
  );

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return notifications.length;
    return notifications.filter((n) => n.category === cat).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Operational Attention Center
            </h2>
            <Badge variant="live" icon={<span className="pulse-dot" />}>
              Live Operational Attention
            </Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Real-time attention items derived from offline kiosks, pending governance documents, and urgent citizen grievances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchNotifs} className="btn btn-secondary btn-sm" title="Refresh alerts">
            <RefreshCw size={14} /> Refresh
          </button>
          {notifications.some((n) => !n.isRead) && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
              <CheckCheck size={14} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['all', 'kiosks', 'knowledge', 'grievances', 'system'] as const).map((cat) => {
          const count = getCategoryCount(cat);
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Notifications Content */}
      {loading ? (
        <LoadingState message="Polling real-time operational alerts from database..." />
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={32} style={{ color: 'var(--danger-600)', margin: '0 auto 0.75rem' }} />
          <h4 style={{ fontWeight: 700, color: 'var(--slate-900)' }}>Unable to Load Attention Items</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', margin: '0.25rem 0 1rem' }}>{error}</p>
          <button onClick={fetchNotifs} className="btn btn-primary btn-sm">Try Again</button>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <EmptyState
          title="All Caught Up"
          description="There are currently no operational alerts requiring administrative attention."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifs.map((item) => {
            const isUnread = !item.isRead;
            const severity = item.severity || (item.type === 'critical' ? 'critical' : item.type === 'warning' ? 'high' : 'info');
            const badgeVariant =
              severity === 'critical'
                ? 'danger'
                : severity === 'high'
                ? 'warning'
                : severity === 'medium'
                ? 'info'
                : 'neutral';

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '1.1rem 1.25rem',
                  backgroundColor: isUnread ? '#ffffff' : 'var(--slate-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isUnread ? 'var(--primary-300)' : 'var(--border-color)'}`,
                  boxShadow: isUnread ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    {item.category === 'kiosks' ? (
                      <Monitor size={18} style={{ color: 'var(--primary-700)' }} />
                    ) : item.category === 'knowledge' ? (
                      <BookOpen size={18} style={{ color: 'var(--trust-700)' }} />
                    ) : (
                      <AlertCircle size={18} style={{ color: 'var(--accent-700)' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {item.title}
                      </h4>
                      <Badge variant={badgeVariant}>{severity.toUpperCase()}</Badge>
                      {isUnread && <Badge variant="warning">New</Badge>}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
                      {item.message}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.35rem' }}>
                      {item.timestamp} • Entity ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{item.entityId || item.id}</span> • Category: <span style={{ textTransform: 'capitalize' }}>{item.category}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      Dismiss
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate(item.linkTab)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    Take Action <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
