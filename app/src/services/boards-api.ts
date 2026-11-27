// HU-09, HU-25, HU-49, HU-26, HU-50 y HU-34 · Llamadas a la API de tableros.
// El dueño lo saca la API del token: aquí nunca se envía quién es.
import { API_URL } from './api-url';
import type { Album, ArtistRef, FieldErrors, ItemKind, Privacy } from './api';

const CONNECTION_ERROR = 'No se ha podido conectar con Hertz. Inténtalo de nuevo en un momento.';
const LOAD_ERROR = 'No se ha podido cargar. Inténtalo de nuevo en un momento.';
export const BOARD_UNAVAILABLE = 'Este tablero no está disponible.';

export type BoardItem = {
  id: string;
  kind: ItemKind;
  catalogId: string;
  title: string;
  coverUrl: string | null;
  albumType: Album['type'] | null;
  artists: ArtistRef[];
  /** La nota que le ha dado quien mira, o null. */
  myRating: number | null;
  addedAt: string;
};

export type Board = {
  id: string;
  name: string;
  description: string | null;
  /** Solo los ve su dueño. */
  privacy?: Privacy;
  coverItemId?: string | null;
  coverUrl: string | null;
  createdAt: string;
  isOwner: boolean;
  owner: { username: string; name: string; photoUrl: string | null };
  itemsCount: number;
  followersCount: number;
  items: BoardItem[];
};

export type BoardForm = { name: string; description: string; privacy?: Privacy };
export type BoardChanges = Partial<{
  name: string;
  description: string;
  privacy: Privacy;
  coverItemId: string | null;
}>;
export type MyBoardOption = { id: string; name: string; privacy: Privacy; contains: boolean };

export type BoardResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors; needsLogin: boolean; notFound: boolean };

const boardPath = (id: string) => `/boards/${encodeURIComponent(id)}`;

async function send<T>(
  path: string,
  init: RequestInit,
  token: string | undefined,
  fetchFn: typeof fetch,
): Promise<BoardResult<T>> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetchFn(`${API_URL}${path}`, { ...init, headers });
    const body = await response.json();
    if (response.ok) return { ok: true, data: body as T };
    const notFound = response.status === 404;
    const errors: FieldErrors = body.errors ?? { form: body.error ?? LOAD_ERROR };
    return { ok: false, errors, needsLogin: response.status === 401, notFound };
  } catch {
    return { ok: false, errors: { form: CONNECTION_ERROR }, needsLogin: false, notFound: false };
  }
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** HU-09 · Crea un tablero; sin privacidad, la API pone la tuya por defecto (RN-09). */
export function createBoard(token: string, form: BoardForm, fetchFn: typeof fetch = fetch) {
  return send<{ id: string }>('/boards', json('POST', form), token, fetchFn);
}

/** El tablero con su contenido. Con sesión, para ver los de amigos y los propios (RN-08). */
export function getBoard(id: string, token?: string, fetchFn: typeof fetch = fetch) {
  return send<Board>(boardPath(id), { method: 'GET' }, token, fetchFn);
}

/** HU-26 y HU-34 · Cambia el nombre, la descripción, la portada o la privacidad. */
export function updateBoard(
  token: string,
  id: string,
  changes: BoardChanges,
  fetchFn: typeof fetch = fetch,
) {
  return send<Board>(boardPath(id), json('PATCH', changes), token, fetchFn);
}

/** HU-50 · Elimina el tablero (después de confirmarlo). */
export function deleteBoard(token: string, id: string, fetchFn: typeof fetch = fetch) {
  return send<{ deleted: true }>(boardPath(id), { method: 'DELETE' }, token, fetchFn);
}

/** HU-25 · Añade una canción o un álbum. Si ya estaba, la API avisa (PA-25-02). */
export function addToBoard(
  token: string,
  boardId: string,
  item: { kind: ItemKind; id: string },
  fetchFn: typeof fetch = fetch,
) {
  return send<{ id: string }>(`${boardPath(boardId)}/items`, json('POST', item), token, fetchFn);
}

/** HU-49 · Quita un elemento del tablero. */
export function removeFromBoard(
  token: string,
  boardId: string,
  itemId: string,
  fetchFn: typeof fetch = fetch,
) {
  return send<{ deleted: true }>(
    `${boardPath(boardId)}/items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
    token,
    fetchFn,
  );
}

/** Tus tableros para «+ A un tablero», diciendo en cuáles ya está. */
export function getMyBoardsFor(
  token: string,
  item: { kind: ItemKind; id: string },
  fetchFn: typeof fetch = fetch,
) {
  const query = `kind=${item.kind}&id=${encodeURIComponent(item.id)}`;
  return send<{ items: MyBoardOption[] }>(`/me/boards?${query}`, { method: 'GET' }, token, fetchFn);
}
