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
    latitude: item.latitude,
    longitude: item.longitude,
    locationAccuracy: item.location_accuracy,
    locationSource: item.location_source,
    installationPhotoPath: item.installation_photo_path,
    lastKnownLatitude: item.last_known_latitude,
    lastKnownLongitude: item.last_known_longitude,
    lastLocationUpdate: item.last_location_update,
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


export async function createKiosk(payload: {
  name: string;
  pacs_name: string;
  location: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  location_source?: string;
  status?: string;
}): Promise<{ success: boolean; message: string; data?: KioskItem }> {
  const res = await request<any>('/api/admin/kiosks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.isRealBackend && res.data) {
    const mapped = mapBackendKioskToItem(res.data);
    localKiosksState.unshift(mapped);
    return { success: true, message: 'Kiosk created successfully', data: mapped };
  }
  return { success: false, message: res.error || 'Failed to create kiosk' };
}

export async function uploadKioskPhoto(kioskId: string, file: File): Promise<{ success: boolean; url?: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('sih_admin_auth');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const response = await fetch(`/api/admin/kiosks/${kioskId}/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, url: data.url, message: 'Photo uploaded' };
    }
    return { success: false, message: data.detail || 'Upload failed' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
