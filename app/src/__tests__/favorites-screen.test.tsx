import { render, screen } from '@testing-library/react-native';

import FavoritesScreen from '../app/favoritos';
import { getMyFavorites } from '../services/api';
import { clearSession, getSession, saveSession } from '../services/session';

const mockRouter = { replace: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Redirect: ({ href }: { href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText>Redirige a {href}</MockText>;
  },
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText accessibilityHint={href}>{children}</MockText>;
  },
}));
jest.mock('../services/api', () => ({ getMyFavorites: jest.fn() }));

const session = {
  token: 'tok',
  user: { id: 1, name: 'Lucía', username: 'lucia', email: 'l@c.es', role: 'user' },
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
});

test('test_FavoritesScreen_withoutSession_goesToLogin', async () => {
  await render(<FavoritesScreen />);
  expect(screen.getByText('Redirige a /acceso')).toBeTruthy();
});

test('test_PA_07_01_FavoritesScreen_showsSubcategoriesWithLinks', async () => {
  saveSession(session);
  jest.mocked(getMyFavorites).mockResolvedValue({
    ok: true,
    data: {
      songs: [
        {
          id: '10',
          title: 'Static Bloom',
          albumId: '1',
          albumTitle: 'Soft Static',
          coverUrl: null,
          artists: [],
        },
      ],
      albums: [],
      artists: [{ id: '3', name: 'Mara Kei', genre: 'Pop', imageUrl: null }],
    },
  });

  await render(<FavoritesScreen />);

  expect(await screen.findByText('CANCIONES · 1')).toBeTruthy();
  expect(screen.getByText('ARTISTAS · 1')).toBeTruthy();
  expect(screen.queryByText(/ÁLBUMES/)).toBeNull();
  expect(screen.getByText('Static Bloom').props.accessibilityHint).toBe('/cancion/10');
  expect(getMyFavorites).toHaveBeenCalledWith('tok');
});

test('test_FavoritesScreen_empty_explainsHowToAdd', async () => {
  saveSession(session);
  jest.mocked(getMyFavorites).mockResolvedValue({
    ok: true,
    data: { songs: [], albums: [], artists: [] },
  });

  await render(<FavoritesScreen />);

  expect(await screen.findByText(/Todavía no tienes favoritos/)).toBeTruthy();
});

test('test_FavoritesScreen_expiredSession_asksToLogIn', async () => {
  saveSession(session);
  jest.mocked(getMyFavorites).mockResolvedValue({ ok: false, error: 'x', needsLogin: true });

  await render(<FavoritesScreen />);

  await screen.findByText('MIS FAVORITOS');
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(getSession()).toBeNull();
  expect(mockRouter.replace).toHaveBeenCalledWith({
    pathname: '/acceso',
    params: { aviso: 'caducada' },
  });
});

test('test_FavoritesScreen_error_isShown', async () => {
  saveSession(session);
  jest
    .mocked(getMyFavorites)
    .mockResolvedValue({ ok: false, error: 'Sin conexión.', needsLogin: false });

  await render(<FavoritesScreen />);

  expect(await screen.findByText('Sin conexión.')).toBeTruthy();
});
