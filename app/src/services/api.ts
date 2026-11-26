// Llamadas a la API de Hertz.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export const CONNECTION_ERROR =
  'No se ha podido conectar con Hertz. Inténtalo de nuevo en un momento.';

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

export type Privacy = 'public' | 'friends' | 'private';

type RatingSummary = {
  /** La nota que le ha dado quien mira (null si no la ha valorado o es un visitante). */
  myRating: number | null;
  /** Su reseña con texto, si ya la ha publicado (HU-23). */
  myReview?: { body: string; privacy: Privacy } | null;
  /** Su nivel de privacidad por defecto (RN-09); null para un visitante. */
  defaultPrivacy?: Privacy | null;
  /** Si quien mira lo tiene en favoritos (HU-07). */
  isFavorite?: boolean;
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
type CatalogKind = ItemKind | 'artist';

export type ArtistAlbum = {
  id: string;
  title: string;
  coverUrl: string | null;
  type: Album['type'];
  releaseYear: number | null;
  averageRating: number | null;
};

export type Artist = {
  id: string;
  name: string;
  imageUrl: string | null;
  /** Autor y licencia de la foto (Wikimedia Commons). */
  imageCredit: string | null;
  /** Si quien mira lo tiene en favoritos (HU-07). */
  isFavorite?: boolean;
  genre: string | null;
  description: string | null;
  songsCount: number;
  albums: ArtistAlbum[];
};

export type LoadResult<T> = { ok: true; data: T } | { ok: false; notFound: boolean; error: string };

const ITEM_PATHS: Record<CatalogKind, string> = {
  album: 'albums',
  song: 'songs',
  artist: 'artists',
};
const NOT_FOUND: Record<CatalogKind, string> = {
  album: 'Este álbum no existe o ya no está en el catálogo.',
  song: 'Esta canción no existe o ya no está en el catálogo.',
  artist: 'Este artista no existe o ya no está en el catálogo.',
};
const LOAD_ERROR = 'No se ha podido cargar. Inténtalo de nuevo en un momento.';

/** Con sesión se envía el token para ver también las reseñas de amigos y las propias (RN-08). */
function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJson<T>(
  kind: CatalogKind,
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
function itemPath(kind: CatalogKind, id: string): string {
  return `/${ITEM_PATHS[kind]}/${encodeURIComponent(id)}`;
}

export function getAlbum(id: string, token?: string, fetchFn: typeof fetch = fetch) {
  return getJson<Album>('album', itemPath('album', id), token, fetchFn);
}

export function getSong(id: string, token?: string, fetchFn: typeof fetch = fetch) {
  return getJson<Song>('song', itemPath('song', id), token, fetchFn);
}

/** HU-59 · Ficha de un artista. Con sesión se envía el token para saber si es favorito (HU-07). */
export function getArtist(id: string, token?: string, fetchFn: typeof fetch = fetch) {
  return getJson<Artist>('artist', itemPath('artist', id), token, fetchFn);
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

// ---------- HU-03 · Buscar contenido ----------

export type SearchResults = {
  query: string;
  songs: {
    id: string;
    title: string;
    albumId: string;
    albumTitle: string;
    coverUrl: string | null;
    artists: ArtistRef[];
  }[];
  albums: {
    id: string;
    title: string;
    type: Album['type'];
    releaseYear: number | null;
    coverUrl: string | null;
    artists: ArtistRef[];
  }[];
  artists: { id: string; name: string; genre: string | null; imageUrl: string | null }[];
  users: { username: string; name: string; photoUrl: string | null }[];
  communities: { id: string; name: string; access: 'public' | 'private'; membersCount: number }[];
};

export type SearchResult = { ok: true; data: SearchResults } | { ok: false; error: string };

/** Con sesión se envía el token para que no salgan los usuarios bloqueados (RN-12). */
export async function search(
  term: string,
  token?: string,
  fetchFn: typeof fetch = fetch,
): Promise<SearchResult> {
  try {
    const response = await fetchFn(`${API_URL}/search?q=${encodeURIComponent(term)}`, {
      headers: authHeaders(token),
    });
    if (response.ok) return { ok: true, data: (await response.json()) as SearchResults };
    if (response.status === 400) {
      const body = (await response.json()) as { errors?: { q?: string } };
      return { ok: false, error: body.errors?.q ?? LOAD_ERROR };
    }
    return { ok: false, error: LOAD_ERROR };
  } catch {
    return { ok: false, error: CONNECTION_ERROR };
  }
}

// ---------- HU-05 · Valorar una canción o un álbum ----------

export type RatingResult =
  | { ok: true; data: Omit<RatingSummary, 'myRating'> & { myRating: number } }
  | { ok: false; error: string; needsLogin: boolean };

/** Guarda la nota del usuario (del 1 al 5). El usuario lo saca la API del token, nunca de aquí. */
export async function rateItem(
  kind: ItemKind,
  id: string,
  rating: number,
  token?: string,
  fetchFn: typeof fetch = fetch,
): Promise<RatingResult> {
  try {
    const response = await fetchFn(`${API_URL}${itemPath(kind, id)}/rating`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ rating }),
    });
    const body = await response.json();
    if (response.ok) return { ok: true, data: body };
    const error = body.errors?.rating ?? body.error ?? LOAD_ERROR;
    return { ok: false, error, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}

// ---------- HU-23 · Escribir una reseña ----------

export type ReviewForm = { rating: number; body: string; privacy: Privacy };

export type PublishResult =
  | {
      ok: true;
      data: {
        myRating: number;
        myReview: { body: string; privacy: Privacy };
        averageRating: number | null;
        ratingsCount: number;
        distribution: RatingDistribution;
        review: Review;
      };
    }
  | { ok: false; errors: FieldErrors; needsLogin: boolean };

/** Publica la reseña. El autor lo saca la API del token. */
export async function publishReview(
  kind: ItemKind,
  id: string,
  form: ReviewForm,
  token?: string,
  fetchFn: typeof fetch = fetch,
): Promise<PublishResult> {
  try {
    const response = await fetchFn(`${API_URL}${itemPath(kind, id)}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(form),
    });
    const body = await response.json();
    if (response.ok) return { ok: true, data: body };
    return {
      ok: false,
      errors: body.errors ?? { general: body.error ?? LOAD_ERROR },
      needsLogin: response.status === 401,
    };
  } catch {
    return { ok: false, errors: { general: CONNECTION_ERROR }, needsLogin: false };
  }
}

// ---------- HU-07 y HU-46 · Favoritos ----------

export type FavoriteKind = CatalogKind;

/** Una parte de una lista larga: los primeros elementos y cuántos hay en total. */
export type Page<T> = { total: number; items: T[] };

/** Lo que devuelve cada «Ver más»: la siguiente parte, desde `offset`. */
export type NextPage<T> = { offset: number; pageSize: number; items: T[] };

export type FavoriteSong = SearchResults['songs'][number];
export type FavoriteAlbum = SearchResults['albums'][number];
export type FavoriteArtist = SearchResults['artists'][number];
export type FavoriteType = 'songs' | 'albums' | 'artists';

/** Favoritos por subcategoría: solo los primeros de cada una, con su total. */
export type Favorites = {
  songs: Page<FavoriteSong>;
  albums: Page<FavoriteAlbum>;
  artists: Page<FavoriteArtist>;
};

export type PageResult<T> =
  { ok: true; data: NextPage<T> } | { ok: false; error: string; needsLogin: boolean };

async function getPage<T>(
  path: string,
  token: string,
  fetchFn: typeof fetch,
): Promise<PageResult<T>> {
  try {
    const response = await fetchFn(`${API_URL}${path}`, { headers: authHeaders(token) });
    if (response.ok) return { ok: true, data: (await response.json()) as NextPage<T> };
    return { ok: false, error: LOAD_ERROR, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}

export type FavoriteResult = { ok: true } | { ok: false; error: string; needsLogin: boolean };

/** Marca (favorite = true) o quita (false) un favorito. El usuario sale del token. */
export async function setFavorite(
  kind: FavoriteKind,
  id: string,
  favorite: boolean,
  token?: string,
  fetchFn: typeof fetch = fetch,
): Promise<FavoriteResult> {
  try {
    const response = await fetchFn(`${API_URL}${itemPath(kind, id)}/favorite`, {
      method: favorite ? 'PUT' : 'DELETE',
      headers: authHeaders(token),
    });
    if (response.ok) return { ok: true };
    const body = (await response.json()) as { error?: string };
    return { ok: false, error: body.error ?? LOAD_ERROR, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}

type FavoriteItem = { songs: FavoriteSong; albums: FavoriteAlbum; artists: FavoriteArtist };

/** «Ver más» de una subcategoría de tus favoritos, a partir de los que ya se ven. */
export function getMyFavorites<K extends FavoriteType>(
  token: string,
  type: K,
  offset: number,
  fetchFn: typeof fetch = fetch,
): Promise<PageResult<FavoriteItem[K]>> {
  return getPage(`/me/favorites?type=${type}&offset=${offset}`, token, fetchFn);
}

// ---------- HU-06 · Consultar mi perfil ----------

export type ProfileReview = {
  id: string;
  rating: number;
  body: string | null;
  privacy: Privacy;
  createdAt: string;
  kind: ItemKind;
  itemId: string;
  itemTitle: string;
  coverUrl: string | null;
  albumType: Album['type'] | null;
};

/** `coverUrl`: la carátula de uno de sus elementos (el elegido o, si no, el primero). */
export type ProfileBoard = {
  id: string;
  name: string;
  privacy: Privacy;
  itemsCount: number;
  coverUrl: string | null;
};

export type OwnProfile = {
  user: { id: string; name: string; username: string; bio: string | null; photoUrl: string | null };
  counts: {
    reviews: number;
    followers: number;
    following: number;
    friends: number;
    favorites: number;
    boards: number;
  };
  reviews: Page<ProfileReview>;
  favorites: Favorites;
  boards: ProfileBoard[];
};

/** Tu perfil: información, contadores y las carpetas Reseñas, Favoritos y Tableros. */
export async function getMyProfile(
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ ok: true; data: OwnProfile } | { ok: false; error: string; needsLogin: boolean }> {
  try {
    const response = await fetchFn(`${API_URL}/me/profile`, { headers: authHeaders(token) });
    if (response.ok) return { ok: true, data: (await response.json()) as OwnProfile };
    return { ok: false, error: LOAD_ERROR, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}

/** «Ver más reseñas» en la carpeta Reseñas. */
export function getMyReviews(
  token: string,
  offset: number,
  fetchFn: typeof fetch = fetch,
): Promise<PageResult<ProfileReview>> {
  return getPage(`/me/reviews?offset=${offset}`, token, fetchFn);
}
