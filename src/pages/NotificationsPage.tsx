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
} from 'lucide-react';
import { Card } from '../components/common/Card';
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
  role,
  onRefreshBadge,
}) => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    onRefreshBadge();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onRefreshBadge();
  };

  const filteredNotifs = notifications.filter(
    (n) => categoryFilter === 'all' || n.category === categoryFilter
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Operational Attention Center
            </h2>
            <Badge variant="demo">Alert Stream</Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Actionable alerts across deployed kiosks, pending knowledge verifications, and unassigned grievances.
          </p>
        </div>

        <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
          <CheckCheck size={14} /> Mark All as Read
        </button>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['all', 'kiosks', 'knowledge', 'grievances', 'system'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingState message="Polling alert streams..." />
      ) : filteredNotifs.length === 0 ? (
        <EmptyState
          title="All Caught Up"
          description="There are currently no operational alerts requiring staff attention."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifs.map((item) => {
            const isUnread = !item.isRead;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.1rem 1.25rem',
                  backgroundColor: isUnread ? '#ffffff' : 'var(--slate-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isUnread ? 'var(--primary-200)' : 'var(--border-color)'}`,
                  boxShadow: isUnread ? 'var(--shadow-sm)' : 'none',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {item.title}
                      </h4>
                      {isUnread && <Badge variant="warning">New</Badge>}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
                      {item.message}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.35rem' }}>
                      {item.timestamp} • Category: <span style={{ textTransform: 'capitalize' }}>{item.category}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
