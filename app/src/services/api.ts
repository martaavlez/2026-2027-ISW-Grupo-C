const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type ApiStatus = 'ok' | 'error';

export async function getApiStatus(fetchFn: typeof fetch = fetch): Promise<ApiStatus> {
  try {
    const response = await fetchFn(`${API_URL}/health`);
    return response.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
