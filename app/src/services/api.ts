// Llamadas a la API de Hertz.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type User = { id: number; name: string; username: string; email: string; role: string };
export type Session = { token: string; user: User };
export type FieldErrors = Partial<Record<string, string>>;
export type PasswordRequirements = { minLength: boolean; letter: boolean; number: boolean };

export type RegistrationForm = {
  name: string;
  username: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export type RegisterResult =
  | { ok: true; session: Session }
  | { ok: false; errors: FieldErrors; passwordRequirements?: PasswordRequirements };

const CONNECTION_ERROR = 'No se ha podido conectar con Hertz. Inténtalo de nuevo en un momento.';

/** HU-01 · Crea la cuenta. Si algo falla, devuelve los mensajes de cada campo. */
export async function registerUser(
  form: RegistrationForm,
  fetchFn: typeof fetch = fetch,
): Promise<RegisterResult> {
  try {
    const response = await fetchFn(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const body = await response.json();
    if (response.ok) return { ok: true, session: body };
    return {
      ok: false,
      errors: body.errors ?? { general: CONNECTION_ERROR },
      passwordRequirements: body.passwordRequirements,
    };
  } catch {
    return { ok: false, errors: { general: CONNECTION_ERROR } };
  }
}

// ---------- HU-04 · Fichas de canción y álbum ----------

export type ArtistRef = { id: string; name: string };
export type RatingDistribution = Record<'1' | '2' | '3' | '4' | '5', number>;

export type Review = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string | null;
  username: string;
  name: string;
  photoUrl: string | null;
};

export type ReviewsPage = { total: number; pageSize: number; offset: number; items: Review[] };

type RatingSummary = {
  averageRating: number | null;
  ratingsCount: number;
  distribution: RatingDistribution;
};

export type AlbumSong = {
  id: string;
  title: string;
  trackNumber: number | null;
  durationSeconds: number;
  averageRating: number | null;
};

export type Album = RatingSummary & {
  id: string;
  title: string;
  coverUrl: string | null;
  genre: string | null;
  type: 'album' | 'ep' | 'single';
  releaseYear: number | null;
  artists: ArtistRef[];
  songs: AlbumSong[];
  totalDurationSeconds: number;
  reviews: ReviewsPage;
};

export type Song = RatingSummary & {
  id: string;
  title: string;
  trackNumber: number | null;
  durationSeconds: number;
  genre: string | null;
  album: {
    id: string;
    title: string;
    coverUrl: string | null;
    type: Album['type'];
    releaseYear: number | null;
  };
  artists: ArtistRef[];
  reviews: ReviewsPage;
};

export type ItemKind = 'album' | 'song';

export type LoadResult<T> = { ok: true; data: T } | { ok: false; notFound: boolean; error: string };

const ITEM_PATHS: Record<ItemKind, string> = { album: 'albums', song: 'songs' };
const NOT_FOUND: Record<ItemKind, string> = {
  album: 'Este álbum no existe o ya no está en el catálogo.',
  song: 'Esta canción no existe o ya no está en el catálogo.',
};
const LOAD_ERROR = 'No se ha podido cargar. Inténtalo de nuevo en un momento.';

/** Con sesión se envía el token para ver también las reseñas de amigos y las propias (RN-08). */
function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJson<T>(
  kind: ItemKind,
  path: string,
  token: string | undefined,
  fetchFn: typeof fetch,
): Promise<LoadResult<T>> {
  try {
    const response = await fetchFn(`${API_URL}${path}`, { headers: authHeaders(token) });
    if (response.ok) return { ok: true, data: (await response.json()) as T };
    const notFound = response.status === 404 || response.status === 400;
    return { ok: false, notFound, error: notFound ? NOT_FOUND[kind] : LOAD_ERROR };
  } catch {
    return { ok: false, notFound: false, error: CONNECTION_ERROR };
  }
}

/** El id va en la URL: se codifica para que nunca pueda cambiar la ruta que se pide. */
function itemPath(kind: ItemKind, id: string): string {
  return `/${ITEM_PATHS[kind]}/${encodeURIComponent(id)}`;
}

export function getAlbum(id: string, token?: string, fetchFn: typeof fetch = fetch) {
  return getJson<Album>('album', itemPath('album', id), token, fetchFn);
}

export function getSong(id: string, token?: string, fetchFn: typeof fetch = fetch) {
  return getJson<Song>('song', itemPath('song', id), token, fetchFn);
}

/** «Ver más reseñas»: la siguiente página a partir de offset. */
export function getReviews(
  kind: ItemKind,
  id: string,
  offset: number,
  token?: string,
  fetchFn: typeof fetch = fetch,
) {
  return getJson<ReviewsPage>(
    kind,
    `${itemPath(kind, id)}/reviews?offset=${offset}`,
    token,
    fetchFn,
  );
}
