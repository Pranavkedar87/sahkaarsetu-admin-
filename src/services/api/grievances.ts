import { request } from './client';
import { GrievanceRecord, GrievanceStatus, GrievancePriority } from '../../types';

export interface BackendNoteItem {
  id: string;
  note: string;
  author_id: string;
  author_name: string;
  author_role: string;
  created_at: string;
}

export interface BackendConversationMessage {
  role: string;
  content: string;
  language: string;
  created_at: string;
  intent?: string;
}

export interface BackendGrievanceDetail {
  id: string;
  conversation_id?: string | null;
  category: string;
  description: string;
  status: string;
  priority: string;
  assigned_staff?: string | null;
  pacs_name?: string | null;
  citizen_masked_name: string;
  citizen_phone_masked: string;
  ai_guidance?: string | null;
  staff_notes?: BackendNoteItem[];
  conversation?: BackendConversationMessage[];
  created_at: string;
  updated_at: string;
}

export interface BackendGrievanceListResponse {
  items: BackendGrievanceDetail[];
  page: number;
  page_size: number;
  total: number;
}

function mapStatusToUi(status: string, assignedStaff?: string | null): GrievanceStatus {
  const s = (status || '').toLowerCase();
  if (s === 'resolved' || s === 'closed') return 'Resolved';
  if (s === 'under_review') {
    return assignedStaff ? 'In Progress' : 'Assigned';
  }
  return 'New';
}

function mapStatusToBackend(uiStatus: GrievanceStatus): string {
  switch (uiStatus) {
    case 'New':
      return 'submitted';
    case 'Assigned':
    case 'In Progress':
    case 'Escalated':
      return 'under_review';
    case 'Resolved':
      return 'resolved';
    default:
      return 'under_review';
  }
}

function mapPriorityToUi(p: string): GrievancePriority {
  const pl = (p || '').toLowerCase();
  if (pl === 'urgent') return 'Urgent';
  if (pl === 'high') return 'High';
  if (pl === 'low') return 'Low';
  return 'Medium';
}

export function mapBackendToRecord(b: BackendGrievanceDetail): GrievanceRecord {
  const notes = (b.staff_notes || []).map(
    (n) => `${n.created_at ? n.created_at.split('T')[0] : ''}: ${n.note} (${n.author_name || 'Staff'})`
  );

  return {
    id: b.id,
    citizenMaskedName: b.citizen_masked_name || 'Citizen (Protected)',
    citizenPhoneMasked: b.citizen_phone_masked || '+91 98******45',
    pacsName: b.pacs_name || 'Primary Agriculture Cooperative Society',
    category: (b.category as any) || 'PACS Service',
    date: b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    priority: mapPriorityToUi(b.priority),
    assignedStaff: b.assigned_staff || undefined,
    status: mapStatusToUi(b.status, b.assigned_staff),
    citizenQuery: b.description,
    contextSummary: b.description,
    aiGuidanceProvided: b.ai_guidance || 'Advised standard cooperative redressal procedures.',
    sourceReference: 'Maharashtra Cooperative Societies Act & Model PACS Rules',
    staffNotes: notes,
    isRealBackend: true,
  };
}

export interface GrievanceFilterParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  category?: string;
  pacs?: string;
  search?: string;
}

export async function getGrievanceList(params: GrievanceFilterParams = {}): Promise<{
  grievances: GrievanceRecord[];
  total: number;
  isRealBackend: boolean;
  message: string;
}> {
  const queryParts: string[] = [];
  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.pageSize) queryParts.push(`page_size=${params.pageSize}`);
  if (params.status && params.status !== 'all') {
    queryParts.push(`status=${encodeURIComponent(mapStatusToBackend(params.status as any))}`);
  }
  if (params.priority && params.priority !== 'all') {
    queryParts.push(`priority=${encodeURIComponent(params.priority.toLowerCase())}`);
  }
  if (params.category && params.category !== 'all') {
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  }
  if (params.pacs) queryParts.push(`pacs=${encodeURIComponent(params.pacs)}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);

  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const res = await request<BackendGrievanceListResponse>(`/api/admin/grievances${qs}`);

  if (res.data && Array.isArray(res.data.items)) {
    const list = res.data.items.map(mapBackendToRecord);
    return {
      grievances: list,
      total: res.data.total,
      isRealBackend: true,
      message: 'Live Backend Data • FastAPI /api/admin/grievances',
    };
  }

  return {
    grievances: [],
    total: 0,
    isRealBackend: false,
    message: res.error || 'Failed to fetch grievances from backend API.',
  };
}

export async function fetchGrievanceById(grievanceId: string): Promise<{
  grievance: GrievanceRecord | null;
  detail?: BackendGrievanceDetail | null;
  isRealBackend: boolean;
  error?: string | null;
}> {
  const res = await request<BackendGrievanceDetail>(`/api/admin/grievances/${encodeURIComponent(grievanceId)}`);

  if (res.data && res.data.id) {
    return {
      grievance: mapBackendToRecord(res.data),
      detail: res.data,
      isRealBackend: true,
    };
  }

  return {
    grievance: null,
    isRealBackend: false,
    error: res.error || 'Case not found or access denied.',
  };
}

export async function updateGrievanceStatus(
  id: string,
  newStatus: GrievanceStatus,
  note?: string
): Promise<{ success: boolean; message: string; record?: GrievanceRecord }> {
  const backendStatus = mapStatusToBackend(newStatus);
  const res = await request<BackendGrievanceDetail>(`/api/admin/grievances/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: backendStatus }),
  });

  if (res.data && res.data.id) {
    // If a note was also provided, submit it
    if (note && note.trim()) {
      await addGrievanceNote(id, note);
    }
    return {
      success: true,
      message: `Grievance status updated to "${newStatus}" via FastAPI backend.`,
      record: mapBackendToRecord(res.data),
    };
  }

  return {
    success: false,
    message: res.error || 'Failed to update grievance status.',
  };
}

export async function assignGrievanceStaff(
  id: string,
  staffName: string
): Promise<{ success: boolean; message: string; record?: GrievanceRecord }> {
  const res = await request<BackendGrievanceDetail>(`/api/admin/grievances/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_staff: staffName, status: 'under_review' }),
  });

  if (res.data && res.data.id) {
    return {
      success: true,
      message: `Case assigned to "${staffName}" via FastAPI backend.`,
      record: mapBackendToRecord(res.data),
    };
  }

  return {
    success: false,
    message: res.error || 'Failed to assign staff.',
  };
}

export async function addGrievanceNote(
  id: string,
  note: string
): Promise<{ success: boolean; message: string; record?: GrievanceRecord }> {
  const res = await request<BackendGrievanceDetail>(`/api/admin/grievances/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note: note.trim() }),
  });

  if (res.data && res.data.id) {
    return {
      success: true,
      message: 'Internal note appended to case history via FastAPI backend.',
      record: mapBackendToRecord(res.data),
    };
  }

  return {
    success: false,
    message: res.error || 'Failed to add note.',
  };
}

