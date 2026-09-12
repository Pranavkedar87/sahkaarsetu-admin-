import {
  DEMO_QUERY_TIMELINE,
  DEMO_CATEGORIES,
  DEMO_LANGUAGES,
  DEMO_KNOWLEDGE_GAPS,
  TimeSeriesPoint,
  CategoryDistribution,
  LanguageDistribution,
} from '../../data/demo';
import { KnowledgeGap } from '../../types';

export interface OperationsAnalytics {
  timeline: TimeSeriesPoint[];
  categories: CategoryDistribution[];
  languages: LanguageDistribution[];
  knowledgeGaps: KnowledgeGap[];
  summary: {
    totalQueries: number;
    voiceQueriesShare: number;
    kioskQueriesShare: number;
    unresolvedEscalations: number;
    knowledgeGapsIdentified: number;
  };
  isRealBackend: boolean;
}

export async function getOperationsAnalytics(): Promise<OperationsAnalytics> {
  // Aggregate from demo metrics
  const totalQueries = DEMO_QUERY_TIMELINE.reduce((sum, p) => sum + p.queries, 0);
  const voiceTotal = DEMO_QUERY_TIMELINE.reduce((sum, p) => sum + p.voiceQueries, 0);
  const kioskTotal = DEMO_QUERY_TIMELINE.reduce((sum, p) => sum + p.kioskQueries, 0);

  return {
    timeline: DEMO_QUERY_TIMELINE,
    categories: DEMO_CATEGORIES,
    languages: DEMO_LANGUAGES,
    knowledgeGaps: DEMO_KNOWLEDGE_GAPS,
    summary: {
      totalQueries,
      voiceQueriesShare: Math.round((voiceTotal / totalQueries) * 100),
      kioskQueriesShare: Math.round((kioskTotal / totalQueries) * 100),
      unresolvedEscalations: 14,
      knowledgeGapsIdentified: DEMO_KNOWLEDGE_GAPS.length,
    },
    isRealBackend: false,
  };
}
