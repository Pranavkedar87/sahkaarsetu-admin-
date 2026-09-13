export type Role = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignedPacs?: string;
  avatar?: string;
}

export type AdminTab = 
  | 'dashboard'
  | 'kiosks'
  | 'knowledge'
  | 'grievances'
  | 'insights'
  | 'notifications'
  | 'profile';

export type KioskStatus = 'online' | 'offline' | 'maintenance';

export interface KioskHealth {
  device: 'ok' | 'degraded' | 'error';
  network: 'online' | 'weak' | 'offline';
  printer: 'ready' | 'low_paper' | 'paper_jam' | 'offline';
  sync: 'synced' | 'pending' | 'failed';
}

export interface KioskItem {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  pacsName: string;
  status: KioskStatus;
  lastActive: string;
  softwareVersion: string;
  ipAddress: string;
  installationDate: string;
  uptimePercent: number;
  queriesToday: number;
  totalQueries: number;
  health: KioskHealth;
  notes?: string;
}

export type DocumentType =
  | 'Cooperative Law'
  | 'By-laws'
  | 'Government Scheme'
  | 'Circular'
  | 'PACS Document'
  | 'PMFBY / Agriculture'
  | 'Financial Literacy'
  | 'Guidelines'
  | 'Other Official Document';

export type DocumentStatus =
  | 'Draft'
  | 'Under Review'
  | 'Verified'
  | 'Published'
  | 'Review Due'
  | 'Outdated';

export interface DocumentVersion {
  version: string;
  effectiveDate: string;
  status: 'Superseded' | 'Current' | 'Draft';
  verificationState: string;
  updatedBy: string;
  notes: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  documentType: DocumentType;
  sourceName: string;
  sourceUrl?: string;
  scope: string;
  state?: string;
  pacsName?: string;
  scheme?: string;
  language: string;
  version: string;
  effectiveDate: string;
  expiryReviewDate?: string;
  applicability?: string;
  status: DocumentStatus;
  lastUpdated: string;
  isRealBackend?: boolean;
  description?: string;
  chunkCount?: number;
  versions?: DocumentVersion[];
  notes?: string;
  is_current?: boolean;
  verificationStatus?: string;
  currentnessStatus?: string;
  authorityLevel?: string;
  jurisdiction?: string;
  precedenceTier?: number;
  rawFileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  reviewNotes?: string;
}

export type GrievanceStatus = 'New' | 'Assigned' | 'In Progress' | 'Escalated' | 'Resolved';
export type GrievancePriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type GrievanceCategory =
  | 'PACS Service'
  | 'Cooperative Issue'
  | 'Scheme'
  | 'PMFBY'
  | 'Financial'
  | 'Documentation'
  | 'Other';

export interface GrievanceRecord {
  id: string;
  citizenMaskedName: string;
  citizenPhoneMasked: string;
  pacsName: string;
  category: GrievanceCategory;
  date: string;
  priority: GrievancePriority;
  assignedStaff?: string;
  status: GrievanceStatus;
  citizenQuery: string;
  contextSummary: string;
  aiGuidanceProvided: string;
  sourceReference?: string;
  staffNotes?: string[];
  isRealBackend?: boolean;
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  frequency: number;
  category: string;
  recommendedAction: string;
  severity: 'high' | 'medium' | 'low';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'warning' | 'info' | 'critical' | 'success';
  category: 'kiosks' | 'knowledge' | 'grievances' | 'system';
  linkTab: AdminTab;
  isRead: boolean;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  entityType?: string;
  entityId?: string;
  createdAt?: string;
}

export interface SystemHealthData {
  status: string;
  service: string;
  aiProvider: string;
  model: string;
  embeddingModel: string;
  isBackendConnected: boolean;
  checkedAt: string;
}
