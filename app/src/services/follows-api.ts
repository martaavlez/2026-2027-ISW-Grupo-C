// HU-10 · Seguir a un usuario y HU-48 · Dejar de seguirlo. Quien sigue lo saca la API del token.
import { API_URL } from './api-url';
import type { Page, Person } from './api';

const CONNECTION_ERROR = 'No se ha podido conectar con Hertz. Inténtalo de nuevo en un momento.';
const LOAD_ERROR = 'No se ha podido cargar. Inténtalo de nuevo en un momento.';

export type FollowState = { following: boolean; followers: number };
export type Followed = Person & { since: string };
export type FollowResult<T> =
  { ok: true; data: T } | { ok: false; error: string; needsLogin: boolean };

async function call<T>(
  method: string,
  path: string,
  token: string,
  fetchFn: typeof fetch,
): Promise<FollowResult<T>> {
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

const followPath = (username: string) => `/users/${encodeURIComponent(username)}/follow`;

/** PA-10-01 · Le sigues al momento, sin que tenga que aprobarlo (RN-10). */
export function followUser(username: string, token: string, fetchFn: typeof fetch = fetch) {
  return call<FollowState>('PUT', followPath(username), token, fetchFn);
}

/** PA-48-01 · Dejas de seguirle. */
export function unfollowUser(username: string, token: string, fetchFn: typeof fetch = fetch) {
  return call<FollowState>('DELETE', followPath(username), token, fetchFn);
}

/** A quién sigues, por partes. */
export function getFollowing(token: string, offset = 0, fetchFn: typeof fetch = fetch) {
  return call<Page<Followed> & { offset: number; pageSize: number }>(
    'GET',
    `/me/following?offset=${offset}`,
    token,
    fetchFn,
  );
}
