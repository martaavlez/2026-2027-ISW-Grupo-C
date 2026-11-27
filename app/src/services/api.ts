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
  token: string | undefined,
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

export type FavoriteItem = { songs: FavoriteSong; albums: FavoriteAlbum; artists: FavoriteArtist };

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

// ---------- HU-24 · Consultar el perfil de otro usuario ----------

// ---------- HU-41, HU-58 y HU-42 · Amistades ----------

/** Amigos, solicitud enviada por ti, recibida por ti o nada. */
export type Friendship = 'none' | 'friends' | 'sent' | 'received';
export type FriendshipState = { friendship: Friendship; requestId: string | null };

/** Tu relación con el usuario del perfil. */
export type Relationship = { isMe: boolean; isFriend: boolean } & FriendshipState;

/**
 * El perfil de otro usuario con lo que puedes ver (RN-08). `favorites` es null si sus
 * favoritos no son visibles para ti, y entonces tampoco se dice cuántos tiene.
 */
export type UserProfile = Omit<OwnProfile, 'counts' | 'favorites'> & {
  counts: Omit<OwnProfile['counts'], 'favorites'> & { favorites: number | null };
  favorites: Favorites | null;
  relationship: Relationship;
};

export type UserProfileResult =
  { ok: true; data: UserProfile } | { ok: false; error: string; notFound: boolean };

const PROFILE_UNAVAILABLE = 'Este perfil no está disponible.';

const userPath = (username: string) => `/users/${encodeURIComponent(username)}`;

export async function getUserProfile(
  username: string,
  token?: string,
  fetchFn: typeof fetch = fetch,
): Promise<UserProfileResult> {
  try {
    const response = await fetchFn(`${API_URL}${userPath(username)}/profile`, {
      headers: authHeaders(token),
    });
    if (response.ok) return { ok: true, data: (await response.json()) as UserProfile };
    const notFound = response.status === 404;
    return { ok: false, error: notFound ? PROFILE_UNAVAILABLE : LOAD_ERROR, notFound };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, notFound: false };
  }
}

/** «Ver más reseñas» en el perfil de otro usuario. */
export function getUserReviews(
  username: string,
  offset: number,
  token?: string,
  fetchFn: typeof fetch = fetch,
): Promise<PageResult<ProfileReview>> {
  return getPage(`${userPath(username)}/reviews?offset=${offset}`, token, fetchFn);
}

/** «Ver más» de una subcategoría de los favoritos de otro usuario. */
export function getUserFavorites<K extends FavoriteType>(
  username: string,
  type: K,
  offset: number,
  token?: string,
  fetchFn: typeof fetch = fetch,
): Promise<PageResult<FavoriteItem[K]>> {
  return getPage(`${userPath(username)}/favorites?type=${type}&offset=${offset}`, token, fetchFn);
}

export type FriendResult =
  { ok: true; data: FriendshipState } | { ok: false; error: string; needsLogin: boolean };

async function changeFriendship(
  method: 'PUT' | 'DELETE' | 'POST',
  path: string,
  token: string,
  fetchFn: typeof fetch,
): Promise<FriendResult> {
  try {
    const response = await fetchFn(`${API_URL}${path}`, { method, headers: authHeaders(token) });
    const body = await response.json();
    if (response.ok) return { ok: true, data: body as FriendshipState };
    const error = body.errors?.friendship ?? body.error ?? LOAD_ERROR;
    return { ok: false, error, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}

/** HU-41 · Envía una solicitud de amistad (PA-41-01). */
export function sendFriendRequest(username: string, token: string, fetchFn: typeof fetch = fetch) {
  return changeFriendship('PUT', `${userPath(username)}/friend-request`, token, fetchFn);
}

/** HU-41 · Cancela la solicitud que enviaste y sigue pendiente (PA-41-02). */
export function cancelFriendRequest(
  username: string,
  token: string,
  fetchFn: typeof fetch = fetch,
) {
  return changeFriendship('DELETE', `${userPath(username)}/friend-request`, token, fetchFn);
}

/** HU-58 · Acepta (PA-58-01) o rechaza (PA-58-02) una solicitud que has recibido. */
export function respondFriendRequest(
  requestId: string,
  accept: boolean,
  token: string,
  fetchFn: typeof fetch = fetch,
) {
  const action = accept ? 'accept' : 'reject';
  return changeFriendship(
    'POST',
    `/me/friend-requests/${encodeURIComponent(requestId)}/${action}`,
    token,
    fetchFn,
  );
}

/** HU-42 · Deja de ser amigo de alguien (PA-42-01). */
export function removeFriend(username: string, token: string, fetchFn: typeof fetch = fetch) {
  return changeFriendship('DELETE', `${userPath(username)}/friendship`, token, fetchFn);
}

export type Person = { username: string; name: string; photoUrl: string | null };
export type FriendRequest = Person & { id: string; requestedAt: string };
export type Friend = Person & { since: string };

/** Las solicitudes que has recibido y siguen pendientes. */
export async function getFriendRequests(
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<
  { ok: true; data: FriendRequest[] } | { ok: false; error: string; needsLogin: boolean }
> {
  try {
    const response = await fetchFn(`${API_URL}/me/friend-requests`, {
      headers: authHeaders(token),
    });
    if (response.ok)
      return { ok: true, data: ((await response.json()) as { items: FriendRequest[] }).items };
    return { ok: false, error: LOAD_ERROR, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}

/** Tus amigos, por partes. */
export async function getFriends(
  token: string,
  offset: number,
  fetchFn: typeof fetch = fetch,
): Promise<
  | { ok: true; data: Page<Friend> & { offset: number; pageSize: number } }
  | { ok: false; error: string; needsLogin: boolean }
> {
  try {
    const response = await fetchFn(`${API_URL}/me/friends?offset=${offset}`, {
      headers: authHeaders(token),
    });
    if (response.ok) return { ok: true, data: await response.json() };
    return { ok: false, error: LOAD_ERROR, needsLogin: response.status === 401 };
  } catch {
    return { ok: false, error: CONNECTION_ERROR, needsLogin: false };
  }
}
