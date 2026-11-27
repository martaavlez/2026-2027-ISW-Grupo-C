import { fireEvent, render, screen } from '@testing-library/react-native';

import FavoritesScreen from '../app/favoritos';
import ProfileScreen from '../app/perfil';
import {
  getFriendRequests,
  getFriends,
  getMyFavorites,
  getMyProfile,
  getMyReviews,
  removeFriend,
  respondFriendRequest,
  type OwnProfile,
} from '../services/api';
import { clearSession, getSession, saveSession } from '../services/session';

const mockRouter = { replace: jest.fn(), setParams: jest.fn() };
let mockParams: { carpeta?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Redirect: ({ href }: { href: string | { pathname: string; params: object } }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText>Redirige a {typeof href === 'string' ? href : JSON.stringify(href)}</MockText>;
  },
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText accessibilityHint={href}>{children}</MockText>;
  },
}));
jest.mock('../services/api', () => ({
  getMyProfile: jest.fn(),
  getMyFavorites: jest.fn(),
  getMyReviews: jest.fn(),
  getFriendRequests: jest.fn(),
  getFriends: jest.fn(),
  respondFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
}));
jest.mock('react-native-svg', () => ({ SvgXml: () => null }));

const session = {
  token: 'tok',
  user: { id: 1, name: 'Lucía Moreno', username: 'lucia', email: 'l@c.es', role: 'user' },
};

const profile: OwnProfile = {
  user: {
    id: '1',
    name: 'Lucía Moreno',
    username: 'lucia',
    bio: 'Reseño discos enteros.',
    photoUrl: null,
  },
  counts: { reviews: 2, followers: 1, following: 3, friends: 1, favorites: 1, boards: 1 },
  reviews: {
    total: 2,
    items: [
      {
        id: '1',
        rating: 5,
        body: 'Un discazo',
        privacy: 'friends',
        createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        kind: 'album',
        itemId: '7',
        itemTitle: 'Soft Static',
        coverUrl: null,
        albumType: 'ep',
      },
      {
        id: '2',
        rating: 3,
        body: null,
        privacy: 'public',
        createdAt: new Date().toISOString(),
        kind: 'song',
        itemId: '10',
        itemTitle: 'Static Bloom',
        coverUrl: null,
        albumType: null,
      },
    ],
  },
  favorites: {
    songs: {
      total: 1,
      items: [
        {
          id: '10',
          title: 'Static Bloom',
          albumId: '7',
          albumTitle: 'Soft Static',
          coverUrl: null,
          artists: [],
        },
      ],
    },
    albums: { total: 0, items: [] },
    artists: { total: 0, items: [] },
  },
  boards: [
    {
      id: '4',
      name: 'Domingos lentos',
      privacy: 'private',
      itemsCount: 1,
      coverUrl: 'https://coverartarchive.org/x',
    },
  ],
};

const song = (n: number) => ({
  id: String(100 + n),
  title: `Pista ${n}`,
  albumId: '7',
  albumTitle: 'Soft Static',
  coverUrl: null,
  artists: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
  mockParams = {};
});

test('test_ProfileScreen_withoutSession_goesToLogin', async () => {
  await render(<ProfileScreen />);
  expect(screen.getByText('Redirige a /acceso')).toBeTruthy();
});

test('test_PA_06_01_ProfileScreen_showsInfoCountsAndReviewsFolder', async () => {
  saveSession(session);
  jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: profile });

  await render(<ProfileScreen />);

  expect(await screen.findByText('@LUCIA')).toBeTruthy();
  expect(screen.getByText('Reseño discos enteros.')).toBeTruthy();
  expect(screen.getByText('2 RESEÑAS · 1 SEGUIDOR · 3 SIGUIENDO · 1 AMIGO')).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'RESEÑAS · 2' }).props.accessibilityState.selected).toBe(
    true,
  );
  expect(screen.getByText('Soft Static').props.accessibilityHint).toBe('/album/7');
  expect(screen.getByText('EP')).toBeTruthy();
  expect(screen.getByText('Un discazo')).toBeTruthy();
  expect(screen.getByText('SOLO AMIGOS · hace 2 días')).toBeTruthy();
  expect(screen.getByText('VALORACIÓN RÁPIDA, SIN TEXTO')).toBeTruthy();
  expect(getMyProfile).toHaveBeenCalledWith('tok');
});

test('test_ProfileScreen_changingFolder_updatesAddress', async () => {
  saveSession(session);
  jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: profile });

  await render(<ProfileScreen />);
  await fireEvent.press(await screen.findByRole('tab', { name: 'TABLEROS · 1' }));

  expect(mockRouter.setParams).toHaveBeenCalledWith({ carpeta: 'tableros' });
});

test('test_PA_06_01_favoritesFolder_showsSubcategories', async () => {
  saveSession(session);
  mockParams = { carpeta: 'favoritos' };
  jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: profile });

  await render(<ProfileScreen />);

  expect(await screen.findByText('CANCIONES · 1')).toBeTruthy();
  expect(screen.getByText('Static Bloom').props.accessibilityHint).toBe('/cancion/10');
  // Con todos a la vista no hay «Ver más».
  expect(screen.queryByText(/VER MÁS/)).toBeNull();
});

test('test_manyFavorites_showTheFirstOnes_andVerMasBringsTheNext', async () => {
  saveSession(session);
  mockParams = { carpeta: 'favoritos' };
  const many: OwnProfile = {
    ...profile,
    favorites: {
      ...profile.favorites,
      songs: { total: 200, items: [1, 2, 3, 4, 5, 6].map(song) },
    },
  };
  jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: many });
  jest.mocked(getMyFavorites).mockResolvedValue({
    ok: true,
    data: { offset: 6, pageSize: 24, items: [song(6), song(7), song(8)] },
  });

  await render(<ProfileScreen />);
  expect(await screen.findByText('CANCIONES · 200')).toBeTruthy();
  expect(screen.queryByText('Pista 7')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'VER MÁS CANCIONES (194)' }));

  expect(getMyFavorites).toHaveBeenCalledWith('tok', 'songs', 6);
  expect(await screen.findByText('Pista 8')).toBeTruthy();
  // La que ya estaba no se repite, y una parte incompleta es la última.
  expect(screen.getAllByText('Pista 6')).toHaveLength(1);
  expect(screen.queryByText(/VER MÁS CANCIONES/)).toBeNull();
});

test('test_verMas_withExpiredSession_asksToLogIn', async () => {
  saveSession(session);
  mockParams = { carpeta: 'favoritos' };
  jest.mocked(getMyProfile).mockResolvedValue({
    ok: true,
    data: {
      ...profile,
      favorites: { ...profile.favorites, songs: { total: 30, items: [song(1)] } },
    },
  });
  jest.mocked(getMyFavorites).mockResolvedValue({ ok: false, error: 'x', needsLogin: true });

  await render(<ProfileScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: /VER MÁS CANCIONES/ }));

  expect(getSession()).toBeNull();
  expect(mockRouter.replace).toHaveBeenCalledWith({
    pathname: '/acceso',
    params: { aviso: 'caducada' },
  });
});

test('test_verMasReviews_bringsOlderOnes_orShowsTheError', async () => {
  saveSession(session);
  jest.mocked(getMyProfile).mockResolvedValue({
    ok: true,
    data: { ...profile, reviews: { ...profile.reviews, total: 15 } },
  });
  jest
    .mocked(getMyReviews)
    .mockResolvedValueOnce({ ok: false, error: 'Sin conexión.', needsLogin: false })
    .mockResolvedValueOnce({
      ok: true,
      data: {
        offset: 2,
        pageSize: 10,
        items: [{ ...profile.reviews.items[0], id: '9', body: 'Una más antigua' }],
      },
    });

  await render(<ProfileScreen />);
  const more = await screen.findByRole('button', { name: 'VER MÁS RESEÑAS (13)' });
  await fireEvent.press(more);
  expect(await screen.findByText('Sin conexión.')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'VER MÁS RESEÑAS (13)' }));
  expect(getMyReviews).toHaveBeenLastCalledWith('tok', 2);
  expect(await screen.findByText('Una más antigua')).toBeTruthy();
});

test('test_PA_06_01_boardsFolder_showsBoards', async () => {
  saveSession(session);
  mockParams = { carpeta: 'tableros' };
  jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: profile });

  await render(<ProfileScreen />);

  expect(await screen.findByText('Domingos lentos')).toBeTruthy();
  expect(screen.getByText('1 ELEMENTO · PRIVADO')).toBeTruthy();
  // Cada tablero es una caja de CD con la portada de uno de sus discos.
  expect(JSON.stringify(screen.toJSON())).toContain('https://coverartarchive.org/x');
  expect(screen.getByText(/Crea tableros personalizados/)).toBeTruthy();
});

test('test_emptyFolders_explainWhatToDo', async () => {
  saveSession(session);
  const empty: OwnProfile = {
    ...profile,
    counts: { ...profile.counts, reviews: 0, favorites: 0, boards: 0 },
    reviews: { total: 0, items: [] },
    favorites: {
      songs: { total: 0, items: [] },
      albums: { total: 0, items: [] },
      artists: { total: 0, items: [] },
    },
    boards: [],
  };
  jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: empty });

  const { rerender } = await render(<ProfileScreen />);
  expect(await screen.findByText(/Todavía no has valorado ni reseñado nada/)).toBeTruthy();

  mockParams = { carpeta: 'favoritos' };
  await rerender(<ProfileScreen />);
  expect(screen.getByText(/Todavía no tienes favoritos/)).toBeTruthy();

  mockParams = { carpeta: 'tableros' };
  await rerender(<ProfileScreen />);
  expect(screen.getByText('Todavía no tienes tableros.')).toBeTruthy();
});

test('test_unknownFolder_fallsBackToReviews', async () => {
  saveSession(session);
  mockParams = { carpeta: '<script>' };
  jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: profile });

  await render(<ProfileScreen />);

  expect(
    (await screen.findByRole('tab', { name: 'RESEÑAS · 2' })).props.accessibilityState.selected,
  ).toBe(true);
});

test('test_ProfileScreen_expiredSession_asksToLogIn', async () => {
  saveSession(session);
  jest.mocked(getMyProfile).mockResolvedValue({ ok: false, error: 'x', needsLogin: true });

  await render(<ProfileScreen />);
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(getSession()).toBeNull();
  expect(mockRouter.replace).toHaveBeenCalledWith({
    pathname: '/acceso',
    params: { aviso: 'caducada' },
  });
});

test('test_ProfileScreen_error_isShown', async () => {
  saveSession(session);
  jest
    .mocked(getMyProfile)
    .mockResolvedValue({ ok: false, error: 'Sin conexión.', needsLogin: false });

  await render(<ProfileScreen />);

  expect(await screen.findByText('Sin conexión.')).toBeTruthy();
});

test('test_oldFavoritesAddress_goesToProfileFolder', async () => {
  await render(<FavoritesScreen />);
  expect(screen.getByText(/carpeta":"favoritos/)).toBeTruthy();
});

// ---------- HU-58 y HU-42 · Carpeta Amigos ----------

describe('Carpeta Amigos', () => {
  const nora = { username: 'nora.eco', name: 'Nora', photoUrl: null };

  async function openFriends() {
    saveSession(session);
    mockParams = { carpeta: 'amigos' };
    jest.mocked(getMyProfile).mockResolvedValue({ ok: true, data: profile });
    await render(<ProfileScreen />);
  }

  test('test_PA_58_01_acceptARequest_refreshesTheFolder', async () => {
    jest
      .mocked(getFriendRequests)
      .mockResolvedValueOnce({
        ok: true,
        data: [{ ...nora, id: '8', requestedAt: new Date().toISOString() }],
      })
      .mockResolvedValue({ ok: true, data: [] });
    jest
      .mocked(getFriends)
      .mockResolvedValueOnce({ ok: true, data: { total: 0, items: [], offset: 0, pageSize: 24 } })
      .mockResolvedValue({
        ok: true,
        data: { total: 1, items: [{ ...nora, since: '' }], offset: 0, pageSize: 24 },
      });
    jest
      .mocked(respondFriendRequest)
      .mockResolvedValue({ ok: true, data: { friendship: 'friends', requestId: null } });

    await openFriends();
    expect(await screen.findByText('SOLICITUDES RECIBIDAS · 1')).toBeTruthy();
    expect(screen.getByText('@nora.eco').props.accessibilityHint).toBe('/usuario/nora.eco');
    await fireEvent.press(screen.getByRole('button', { name: 'Aceptar' }));

    expect(respondFriendRequest).toHaveBeenCalledWith('8', true, 'tok');
    expect(await screen.findByText('AMIGOS · 1')).toBeTruthy();
    expect(screen.queryByText('SOLICITUDES RECIBIDAS · 1')).toBeNull();
  });

  test('test_PA_58_02_rejectARequest', async () => {
    jest.mocked(getFriendRequests).mockResolvedValue({
      ok: true,
      data: [{ ...nora, id: '8', requestedAt: new Date().toISOString() }],
    });
    jest
      .mocked(getFriends)
      .mockResolvedValue({ ok: true, data: { total: 0, items: [], offset: 0, pageSize: 24 } });
    jest
      .mocked(respondFriendRequest)
      .mockResolvedValue({ ok: true, data: { friendship: 'none', requestId: null } });

    await openFriends();
    await fireEvent.press(await screen.findByRole('button', { name: 'Rechazar' }));

    expect(respondFriendRequest).toHaveBeenCalledWith('8', false, 'tok');
  });

  test('test_PA_42_01_removeAFriend_asksFirst', async () => {
    jest.mocked(getFriendRequests).mockResolvedValue({ ok: true, data: [] });
    jest.mocked(getFriends).mockResolvedValue({
      ok: true,
      data: { total: 1, items: [{ ...nora, since: '' }], offset: 0, pageSize: 24 },
    });
    jest
      .mocked(removeFriend)
      .mockResolvedValue({ ok: true, data: { friendship: 'none', requestId: null } });

    await openFriends();
    await fireEvent.press(await screen.findByRole('button', { name: 'Eliminar' }));
    expect(removeFriend).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(removeFriend).toHaveBeenCalledWith('nora.eco', 'tok');
  });

  test('test_noFriends_explainsHowToAddThem', async () => {
    jest.mocked(getFriendRequests).mockResolvedValue({ ok: true, data: [] });
    jest
      .mocked(getFriends)
      .mockResolvedValue({ ok: true, data: { total: 0, items: [], offset: 0, pageSize: 24 } });

    await openFriends();

    expect(await screen.findByText(/Todavía no tienes amigos/)).toBeTruthy();
  });
});
