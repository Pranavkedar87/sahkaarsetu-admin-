import { NotificationItem } from '../../types';
import { DEMO_NOTIFICATIONS } from '../../data/demo';

let localNotifications: NotificationItem[] = [...DEMO_NOTIFICATIONS];

export async function getNotifications(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
  isRealBackend: boolean;
}> {
  const unreadCount = localNotifications.filter((n) => !n.isRead).length;
  return {
    notifications: localNotifications,
    unreadCount,
    isRealBackend: false,
  };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const target = localNotifications.find((n) => n.id === id);
  if (target) {
    target.isRead = true;
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  localNotifications = localNotifications.map((n) => ({ ...n, isRead: true }));
}
