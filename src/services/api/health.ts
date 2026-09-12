import { request, API_BASE_URL } from './client';
import { SystemHealthData } from '../../types';

interface BackendHealthResponse {
  status: string;
  service?: string;
  ai_provider?: string;
  model?: string;
  embedding_provider?: string;
  embedding_model?: string;
  docs?: string;
  health?: string;
}

export async function fetchSystemHealth(): Promise<{
  health: SystemHealthData;
  isLive: boolean;
  apiUrl: string;
}> {
  const res = await request<BackendHealthResponse>('/health');

  if (res.isRealBackend && res.data) {
    return {
      health: {
        status: res.data.status || 'ok',
        service: res.data.service || 'SahkaarSetu Backend',
        aiProvider: res.data.ai_provider || 'gemini',
        model: res.data.model || 'gemini-2.5-flash',
        embeddingModel: res.data.embedding_model || 'gemini-embedding-001',
        isBackendConnected: true,
        checkedAt: new Date().toLocaleTimeString(),
      },
      isLive: true,
      apiUrl: API_BASE_URL,
    };
  }

  // Fallback demo state if backend is offline or sleeping
  return {
    health: {
      status: 'offline_or_sleeping',
      service: 'SahkaarSetu Backend (Standby)',
      aiProvider: 'gemini (configured)',
      model: 'gemini-2.5-flash',
      embeddingModel: 'gemini-embedding-001',
      isBackendConnected: false,
      checkedAt: new Date().toLocaleTimeString(),
    },
    isLive: false,
    apiUrl: API_BASE_URL,
  };
}
