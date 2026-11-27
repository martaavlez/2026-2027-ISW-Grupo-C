import { fireEvent, render, screen } from '@testing-library/react-native';

import UserProfileScreen from '../app/usuario/[username]';
import {
  getUserFavorites,
  getUserProfile,
  getUserReviews,
  type UserProfile,
} from '../services/api';
import { clearSession, saveSession } from '../services/session';

const mockRouter = { replace: jest.fn(), setParams: jest.fn() };
let mockParams: { username: string; carpeta?: string } = { username: 'nora.eco' };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Redirect: ({ href }: { href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText>Redirige a {href}</MockText>;
  },
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText accessibilityHint={href}>{children}</MockText>;
  },
}));
jest.mock('../services/api', () => ({
  getUserProfile: jest.fn(),
  getUserReviews: jest.fn(),
  getUserFavorites: jest.fn(),
}));
jest.mock('react-native-svg', () => ({ SvgXml: () => null }));

const session = {
  token: 'tok',
  user: { id: 1, name: 'Lucía', username: 'lucia', email: 'l@c.es', role: 'user' },
};

const nora: UserProfile = {
  user: { id: '4', name: 'Nora Eco', username: 'nora.eco', bio: 'Solo vinilos.', photoUrl: null },
  counts: { reviews: 12, followers: 3, following: 2, friends: 1, favorites: null, boards: 1 },
  reviews: {
    total: 12,
    items: [
      {
        id: '1',
        rating: 4,
        body: 'Muy buen directo',
        privacy: 'public',
        createdAt: new Date().toISOString(),
        kind: 'album',
        itemId: '7',
        itemTitle: 'Soft Static',
        coverUrl: null,
        albumType: 'album',
      },
    ],
  },
  favorites: null,
  boards: [{ id: '2', name: 'Domingos', privacy: 'public', itemsCount: 3, coverUrl: null }],
  relationship: { isMe: false, isFriend: false },
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
  mockParams = { username: 'nora.eco' };
});

test('test_PA_24_01_showsInfoAndWhatICanSee', async () => {
  saveSession(session);
  jest.mocked(getUserProfile).mockResolvedValue({ ok: true, data: nora });

  await render(<UserProfileScreen />);

  expect(await screen.findByText('@NORA.ECO')).toBeTruthy();
  expect(screen.getByText('Nora Eco')).toBeTruthy();
  expect(screen.getByText('Solo vinilos.')).toBeTruthy();
  expect(screen.getByText('Muy buen directo')).toBeTruthy();
  expect(getUserProfile).toHaveBeenCalledWith('nora.eco', 'tok');
  // Sus favoritos no son visibles: ni cuántos tiene.
  expect(screen.getByText('FAVORITOS')).toBeTruthy();
  expect(screen.queryByText('✓ SOIS AMIGOS')).toBeNull();
});

test('test_favoritesHidden_saysSo', async () => {
  mockParams = { username: 'nora.eco', carpeta: 'favoritos' };
  jest.mocked(getUserProfile).mockResolvedValue({ ok: true, data: nora });

  await render(<UserProfileScreen />);

  expect(await screen.findByText('Sus favoritos no son visibles para ti.')).toBeTruthy();
});

test('test_PA_24_02_friend_seesBadgeAndFavorites', async () => {
  saveSession(session);
  mockParams = { username: 'nora.eco', carpeta: 'favoritos' };
  jest.mocked(getUserProfile).mockResolvedValue({
    ok: true,
    data: {
      ...nora,
      counts: { ...nora.counts, favorites: 0 },
      favorites: {
        songs: { total: 0, items: [] },
        albums: { total: 0, items: [] },
        artists: { total: 0, items: [] },
      },
      relationship: { isMe: false, isFriend: true },
    },
  });

  await render(<UserProfileScreen />);

  expect(await screen.findByText('✓ SOIS AMIGOS')).toBeTruthy();
  expect(screen.getByText('@nora.eco todavía no tiene favoritos.')).toBeTruthy();
});

test('test_PA_24_03_unavailable_showsMessageOnly', async () => {
  jest
    .mocked(getUserProfile)
    .mockResolvedValue({ ok: false, error: 'Este perfil no está disponible.', notFound: true });

  await render(<UserProfileScreen />);

  expect(await screen.findByText('Este perfil no está disponible.')).toBeTruthy();
  expect(screen.queryByText('@NORA.ECO')).toBeNull();
});

test('test_myOwnUsername_goesToMyProfile', async () => {
  saveSession(session);
  jest.mocked(getUserProfile).mockResolvedValue({
    ok: true,
    data: { ...nora, relationship: { isMe: true, isFriend: false } },
  });

  await render(<UserProfileScreen />);

  expect(await screen.findByText('Redirige a /perfil')).toBeTruthy();
});

test('test_verMasReviews_asksForThatUsersNextPage', async () => {
  jest.mocked(getUserProfile).mockResolvedValue({ ok: true, data: nora });
  jest.mocked(getUserReviews).mockResolvedValue({
    ok: true,
    data: { offset: 1, pageSize: 10, items: [] },
  });

  await render(<UserProfileScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'VER MÁS RESEÑAS (11)' }));

  expect(getUserReviews).toHaveBeenCalledWith('nora.eco', 1, undefined);
  expect(getUserFavorites).not.toHaveBeenCalled();
});
