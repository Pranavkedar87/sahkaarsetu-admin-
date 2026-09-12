import { KnowledgeGap } from '../../types';

export interface TimeSeriesPoint {
  date: string;
  queries: number;
  voiceQueries: number;
  kioskQueries: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface LanguageDistribution {
  language: string;
  code: string;
  count: number;
  percentage: number;
  color: string;
}

export const DEMO_QUERY_TIMELINE: TimeSeriesPoint[] = [
  { date: '01 Mar', queries: 4120, voiceQueries: 2890, kioskQueries: 1420 },
  { date: '03 Mar', queries: 4890, voiceQueries: 3410, kioskQueries: 1680 },
  { date: '05 Mar', queries: 5420, voiceQueries: 3950, kioskQueries: 1950 },
  { date: '07 Mar', queries: 6180, voiceQueries: 4620, kioskQueries: 2210 },
  { date: '09 Mar', queries: 7350, voiceQueries: 5540, kioskQueries: 2790 },
  { date: '11 Mar', queries: 8120, voiceQueries: 6200, kioskQueries: 3100 },
  { date: '13 Mar', queries: 8940, voiceQueries: 6850, kioskQueries: 3480 },
];

export const DEMO_CATEGORIES: CategoryDistribution[] = [
  { category: 'PMFBY Crop Insurance', count: 18450, percentage: 38, color: '#2e7d32' },
  { category: 'Kisan Credit Card (KCC)', count: 12140, percentage: 25, color: '#1565c0' },
  { category: 'PACS By-laws & Membership', count: 7760, percentage: 16, color: '#e65100' },
  { category: 'Fertilizer & Seed Subsidy', count: 4850, percentage: 10, color: '#00838f' },
  { category: 'Grievance Assistance', count: 3400, percentage: 7, color: '#c2185b' },
  { category: 'Other Cooperative Schemes', count: 1950, percentage: 4, color: '#6a1b9a' },
];

export const DEMO_LANGUAGES: LanguageDistribution[] = [
  { language: 'Marathi (मराठी)', code: 'mr', count: 26500, percentage: 55, color: '#2e7d32' },
  { language: 'Hindi (हिंदी)', code: 'hi', count: 14450, percentage: 30, color: '#1565c0' },
  { language: 'English', code: 'en', count: 4820, percentage: 10, color: '#e65100' },
  { language: 'Gujarati (ગુજરાતી)', code: 'gu', count: 2430, percentage: 5, color: '#00838f' },
];

export const DEMO_KNOWLEDGE_GAPS: KnowledgeGap[] = [
  {
    id: 'GAP-001',
    topic: 'Micro-Cold-Storage 35% Capital Subsidy by-law clauses for Nashik Onion PACS',
    frequency: 342,
    category: 'PACS By-laws',
    recommendedAction: 'Upload Maharashtra State PACS Cold-Storage Joint Venture guidelines circular (2025).',
    severity: 'high',
  },
  {
    id: 'GAP-002',
    topic: 'RuPay Kisan Credit Card offline transaction limits without biometric POS in remote talukas',
    frequency: 218,
    category: 'Financial Literacy',
    recommendedAction: 'Draft and index simplified FAQ on offline PIN verification for PACS secretaries.',
    severity: 'medium',
  },
  {
    id: 'GAP-003',
    topic: 'Post-harvest hail loss claim submission beyond 72 hours under Taluka Disaster Declaration',
    frequency: 412,
    category: 'PMFBY / Agriculture',
    recommendedAction: 'Add Annexure-IV offline intimation flow to PMFBY operational document.',
    severity: 'high',
  },
  {
    id: 'GAP-004',
    topic: 'Eligibility of Joint Tenant Farmers for PACS Voting Rights under 2024 MCS Act Amendments',
    frequency: 129,
    category: 'Cooperative Law',
    recommendedAction: 'Verify and link Section 27(3) voting qualification commentary document.',
    severity: 'low',
  },
];
