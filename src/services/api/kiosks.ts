import { KioskHealth, KioskItem, KioskStatus } from '../../types';
import { DEMO_KIOSKS } from '../../data/demo';
import { request } from './client';

let localKiosksState: KioskItem[] = [...DEMO_KIOSKS];

export function mapBackendKioskToItem(item: any): KioskItem {
  let formattedLastActive = 'Never';
  if (item.last_heartbeat) {
    try {
      const dt = new Date(item.last_heartbeat);
      formattedLastActive = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ` (${dt.toLocaleDateString()})`;
    } catch {
      formattedLastActive = item.last_heartbeat;
    }
  }

  const healthObj: KioskHealth = {
    device: item.health?.device || 'ok',
    network: item.health?.network || 'online',
    printer: item.health?.printer || 'ready',
    sync: item.health?.sync || 'synced',
  };

  return {
    id: item.id,
    name: item.name || 'PACS Touchpoint',
    location: item.location || 'PACS Office',
    district: item.district || 'District',
    state: item.state || 'Maharashtra',
    pacsName: item.pacs_name || 'Cooperative Society',
    status: (item.status as KioskStatus) || 'offline',
    lastActive: formattedLastActive,
    softwareVersion: item.software_version || 'v2.4.1',
    ipAddress: item.ip_address || '192.168.1.1',
    installationDate: item.installation_date || '2024-01-15',
    uptimePercent: typeof item.uptime_percent === 'number' ? item.uptime_percent : 99.1,
    queriesToday: 42,
    totalQueries: 1250,
    health: healthObj,
    notes: item.notes || '',
  };
}

export async function getKiosksList(params?: {
  district?: string;
  pacs?: string;
  status?: string;
  search?: string;
}): Promise<{
  kiosks: KioskItem[];
  isRealBackend: boolean;
  message: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.district) queryParams.set('district', params.district);
  if (params?.pacs) queryParams.set('pacs', params.pacs);
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.search) queryParams.set('search', params.search);

  const qs = queryParams.toString();
  const endpoint = `/api/admin/kiosks${qs ? `?${qs}` : ''}`;

  const res = await request<{ items: any[]; total: number }>(endpoint);

  if (res.isRealBackend && res.data && Array.isArray(res.data.items)) {
    const liveItems = res.data.items.map(mapBackendKioskToItem);
    localKiosksState = liveItems;
    return {
      kiosks: liveItems,
      isRealBackend: true,
      message: `Live telemetry synchronized: ${res.data.total} kiosks reporting.`,
    };
  }

  // Fallback to local state if backend unreachable
  return {
    kiosks: localKiosksState,
    isRealBackend: false,
    message: res.error || 'Displaying local fallback kiosk fleet telemetry.',
  };
}

export async function getKioskById(kioskId: string): Promise<KioskItem | null> {
  const res = await request<any>(`/api/admin/kiosks/${kioskId}`);
  if (res.isRealBackend && res.data) {
    return mapBackendKioskToItem(res.data);
  }

  const match = localKiosksState.find((k) => k.id.toLowerCase() === kioskId.toLowerCase());
  return match || null;
}

export async function updateKioskStatus(
  kioskId: string,
  newStatus: KioskStatus,
  notes?: string
): Promise<{ success: boolean; message: string; updated?: KioskItem }> {
  const res = await request<any>(`/api/admin/kiosks/${kioskId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: newStatus,
      ...(notes !== undefined ? { notes } : {}),
    }),
  });

  if (res.isRealBackend && res.data) {
    const mapped = mapBackendKioskToItem(res.data);
    localKiosksState = localKiosksState.map((k) => (k.id === kioskId ? mapped : k));
    return {
      success: true,
      message: `Kiosk ${kioskId} status changed to ${newStatus.toUpperCase()} (Live Backend Synchronized)`,
      updated: mapped,
    };
  }

  // Fallback update
  const target = localKiosksState.find((k) => k.id === kioskId);
  if (target) {
    target.status = newStatus;
    if (notes) target.notes = notes;
    return {
      success: true,
      message: `Kiosk ${kioskId} marked as ${newStatus.toUpperCase()} (Local fallback update)`,
      updated: target,
    };
  }

  return {
    success: false,
    message: res.error || 'Failed to update kiosk status',
  };
}
