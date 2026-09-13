import { request } from './client';
import { KnowledgeGap } from '../../types';

export interface TimeSeriesPoint {
  date: string;
  queries: number;
  voiceQueries?: number | null;
  kioskQueries?: number | null;
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

export interface ChannelTelemetryUnavailable {
  voice_vs_touch: number | null;
  kiosk_vs_web: number | null;
  reason: string;
}

export interface OperationsAnalytics {
  timeline: TimeSeriesPoint[];
  categories: CategoryDistribution[];
  languages: LanguageDistribution[];
  knowledgeGaps: KnowledgeGap[];
  summary: {
    totalQueries: number;
    todayQueries: number;
    thisWeekQueries: number;
    thisMonthQueries: number;
    voiceQueriesShare: number | null;
    kioskQueriesShare: number | null;
    unresolvedEscalations: number;
    knowledgeGapsIdentified: number;
  };
  channelTelemetry: ChannelTelemetryUnavailable;
  isRealBackend: boolean;
  provenance: string;
}

export async function getOperationsAnalytics(period: string = '30d'): Promise<OperationsAnalytics> {
  const [overviewRes, gapsRes] = await Promise.all([
    request<any>(`/api/admin/analytics/overview?period=${encodeURIComponent(period)}`),
    request<any>('/api/admin/analytics/knowledge-gaps'),
  ]);

  if (overviewRes.data) {
    const o = overviewRes.data;
    const gapsData = gapsRes.data?.gaps || [];

    const timeline: TimeSeriesPoint[] = (o.queries?.timeline || []).map((p: any) => {
      let formattedDate = p.date;
      if (p.date && p.date.includes('-')) {
        try {
          const dt = new Date(p.date);
          formattedDate = dt.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        } catch {
          formattedDate = p.date;
        }
      }
      return {
        date: formattedDate,
        queries: p.queries || 0,
        voiceQueries: null,
        kioskQueries: null,
      };
    });

    const categories: CategoryDistribution[] = (o.intents || []).map((i: any) => ({
      category: i.category || i.intent,
      count: i.count || 0,
      percentage: i.percentage || 0,
      color: i.color || '#64748b',
    }));

    const languages: LanguageDistribution[] = (o.languages || []).map((l: any) => ({
      language: l.language,
      code: l.code,
      count: l.count || 0,
      percentage: l.percentage || 0,
      color: l.color || '#64748b',
    }));

    const knowledgeGaps: KnowledgeGap[] = gapsData.map((g: any) => ({
      id: g.id,
      topic: g.topic,
      frequency: g.frequency,
      category: g.category,
      recommendedAction: g.recommended_action || g.recommendedAction || '',
      severity: g.severity || 'medium',
    }));

    const totalQueries = o.queries?.total ?? 0;
    const todayQueries = o.queries?.today ?? 0;
    const thisWeekQueries = o.queries?.this_week ?? 0;
    const thisMonthQueries = o.queries?.this_month ?? 0;
    const unresolvedEscalations = o.grievances?.under_review ?? 0;

    return {
      timeline,
      categories,
      languages,
      knowledgeGaps,
      summary: {
        totalQueries,
        todayQueries,
        thisWeekQueries,
        thisMonthQueries,
        voiceQueriesShare: null,
        kioskQueriesShare: null,
        unresolvedEscalations,
        knowledgeGapsIdentified: knowledgeGaps.length,
      },
      channelTelemetry: {
        voice_vs_touch: null,
        kiosk_vs_web: null,
        reason: o.channel_telemetry?.reason || 'Interaction channel telemetry not recorded in database.',
      },
      isRealBackend: overviewRes.isRealBackend,
      provenance: o.provenance || 'REAL_DB',
    };
  }

  return {
    timeline: [],
    categories: [],
    languages: [],
    knowledgeGaps: [],
    summary: {
      totalQueries: 0,
      todayQueries: 0,
      thisWeekQueries: 0,
      thisMonthQueries: 0,
      voiceQueriesShare: null,
      kioskQueriesShare: null,
      unresolvedEscalations: 0,
      knowledgeGapsIdentified: 0,
    },
    channelTelemetry: {
      voice_vs_touch: null,
      kiosk_vs_web: null,
      reason: 'Backend analytics service currently unreachable.',
    },
    isRealBackend: false,
    provenance: 'UNREACHABLE',
  };
}
