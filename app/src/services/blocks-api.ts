// HU-35 · Bloquear a un usuario y HU-56 · Desbloquearlo. Quien bloquea lo saca la API del token.
import { API_URL } from './api-url';
import type { Page, Person } from './api';

const CONNECTION_ERROR = 'No se ha podido conectar con Hertz. Inténtalo de nuevo en un momento.';
const LOAD_ERROR = 'No se ha podido cargar. Inténtalo de nuevo en un momento.';

export type Blocked = Person & { since: string };
export type BlockResult<T> =
  { ok: true; data: T } | { ok: false; error: string; needsLogin: boolean };

async function call<T>(
  method: string,
  path: string,
  token: string,
  fetchFn: typeof fetch,
): Promise<BlockResult<T>> {
  try {
    const response = await fetchFn(`${API_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    if (response.ok) return { ok: true, data: body as T };
    return { ok: false, error: body.error ?? LOAD_ERROR, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}

const blockPath = (username: string) => `/users/${encodeURIComponent(username)}/block`;

/** PA-35-01 · Bloquea y se eliminan el seguimiento y la amistad entre los dos (RN-12). */
export function blockUser(username: string, token: string, fetchFn: typeof fetch = fetch) {
  return call<{ blocked: true }>('PUT', blockPath(username), token, fetchFn);
}

/** PA-56-01 · Lo desbloquea: vuelve a ver tu contenido público. */
export function unblockUser(username: string, token: string, fetchFn: typeof fetch = fetch) {
  return call<{ blocked: false }>('DELETE', blockPath(username), token, fetchFn);
}

/** Tu lista de bloqueados, por partes. */
export function getBlocked(token: string, offset = 0, fetchFn: typeof fetch = fetch) {
  return call<Page<Blocked> & { offset: number; pageSize: number }>(
    'GET',
    `/me/blocks?offset=${offset}`,
    token,
    fetchFn,
  );
}
