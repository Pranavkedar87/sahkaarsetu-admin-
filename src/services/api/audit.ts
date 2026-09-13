import { AuditLogItem, AuditLogResponse } from '../../types';
import { request } from './client';

export interface AuditLogFilterParams {
  page?: number;
  pageSize?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export function formatAuditDate(dateStr: string): string {
  try {
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export async function fetchAuditLogs(params?: AuditLogFilterParams): Promise<AuditLogResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.pageSize) queryParams.set('page_size', params.pageSize.toString());
  if (params?.action) queryParams.set('action', params.action);
  if (params?.entityType) queryParams.set('entity_type', params.entityType);
  if (params?.entityId) queryParams.set('entity_id', params.entityId);
  if (params?.userId) queryParams.set('user_id', params.userId);
  if (params?.startDate) queryParams.set('start_date', params.startDate);
  if (params?.endDate) queryParams.set('end_date', params.endDate);

  const qs = queryParams.toString();
  const endpoint = `/api/admin/audit-logs${qs ? `?${qs}` : ''}`;

  const res = await request<any>(endpoint);
  if (res.data) {
    const rawItems: any[] = res.data.items || [];
    return {
      status: res.data.status || 'ok',
      items: rawItems.map((item) => ({
        id: item.id,
        userId: item.user_id,
        userName: item.user_name || 'Administrator',
        userRole: item.user_role || 'ADMIN',
        action: item.action,
        entityType: item.entity_type,
        entityId: item.entity_id,
        details: item.details,
        createdAt: item.created_at,
      })),
      page: res.data.page || 1,
      pageSize: res.data.page_size || 20,
      total: res.data.total || 0,
    };
  }

  return {
    status: 'error',
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
  };
}
