/**
 * SahkaarSetu Admin API Client
 *
 * All network requests communicate ONLY with the single FastAPI backend.
 * Never accesses Supabase or Gemini API directly from the browser.
 */

const DEFAULT_DEV_URL = 'http://localhost:8000';
const DEFAULT_PROD_URL = 'https://sih26088-cooperative-ai.onrender.com';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? DEFAULT_PROD_URL : DEFAULT_DEV_URL);

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isRealBackend: boolean;
}

export const TOKEN_STORAGE_KEY = 'sahkaarsetu_admin_jwt_token';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let detailMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.detail) {
          detailMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use default HTTP error
      }
      return {
        data: null,
        error: detailMsg,
        isRealBackend: true,
      };
    }

    const data = await response.json();
    return {
      data,
      error: null,
      isRealBackend: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error or backend offline';
    return {
      data: null,
      error: message,
      isRealBackend: false,
    };
  }
}
