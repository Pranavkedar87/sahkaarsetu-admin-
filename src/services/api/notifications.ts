import { NotificationItem, AdminTab } from '../../types';
import { request } from './client';

export function formatTimeAgo(dateStr: string): string {
  try {
    const dt = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - dt.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Recent';
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return dt.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function mapBackendNotificationToItem(item: any): NotificationItem {
  const severityMap: Record<string, 'critical' | 'warning' | 'info'> = {
    critical: 'critical',
    high: 'warning',
    medium: 'warning',
    low: 'info',
    info: 'info',
  };

  const validTabs: AdminTab[] = ['dashboard', 'kiosks', 'knowledge', 'grievances', 'insights', 'notifications'];
  const targetTab: AdminTab = validTabs.includes(item.link_tab) ? item.link_tab : 'dashboard';

  return {
    id: item.id,
    title: item.title,
    message: item.message,
    timestamp: formatTimeAgo(item.created_at),
    type: severityMap[item.severity] || 'info',
    category: item.category || 'system',
    linkTab: targetTab,
    isRead: Boolean(item.is_read || item.read),
    severity: item.severity,
    entityType: item.entity_type,
    entityId: item.entity_id,
    createdAt: item.created_at,
  };
}

export async function getNotifications(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
  isRealBackend: boolean;
  provenance: string;
}> {
  const res = await request<any>('/api/admin/notifications');
  if (res.data) {
    const list: any[] = res.data.notifications || [];
    const mapped = list.map(mapBackendNotificationToItem);
    return {
      notifications: mapped,
      unreadCount: res.data.unread_count ?? mapped.filter((n) => !n.isRead).length,
      isRealBackend: res.isRealBackend,
      provenance: res.data.provenance || 'REAL_DB',
    };
  }

  return {
    notifications: [],
    unreadCount: 0,
    isRealBackend: false,
    provenance: 'UNREACHABLE',
  };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await request(`/api/admin/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await request('/api/admin/notifications/read-all', {
    method: 'POST',
  });
}
