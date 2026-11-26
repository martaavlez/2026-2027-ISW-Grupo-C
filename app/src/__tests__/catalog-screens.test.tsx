import { fireEvent, render, screen } from '@testing-library/react-native';

import AlbumScreen from '../app/album/[id]';
import ArtistScreen from '../app/artista/[id]';
import SongScreen from '../app/cancion/[id]';
import {
  getAlbum,
  getArtist,
  getReviews,
  getSong,
  type Album,
  type Artist,
  type Review,
  type Song,
} from '../services/api';
import { clearSession, saveSession } from '../services/session';

let mockParams: { id: string } = { id: '1' };

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText accessibilityHint={href}>{children}</MockText>;
  },
}));
jest.mock('../services/api', () => ({
  getAlbum: jest.fn(),
  getSong: jest.fn(),
  getReviews: jest.fn(),
  getArtist: jest.fn(),
}));

const review = (id: string, overrides: Partial<Review> = {}): Review => ({
  id,
  rating: 4,
  body: `Reseña ${id}`,
  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  updatedAt: null,
  username: `usuario${id}`,
  name: 'Nombre',
  photoUrl: null,
  ...overrides,
});

const album: Album = {
  id: '1',
  title: 'Soft Static',
  coverUrl: null,
  genre: 'Dream pop',
  type: 'album',
  releaseYear: 2026,
  averageRating: 4.8,
  ratingsCount: 1204,
  distribution: { 1: 12, 2: 24, 3: 72, 4: 229, 5: 867 },
  artists: [{ id: '3', name: 'Mara Kei' }],
  songs: [
    { id: '10', title: 'Static Bloom', trackNumber: 1, durationSeconds: 222, averageRating: 4.9 },
    { id: '11', title: 'Paper Walls', trackNumber: 2, durationSeconds: 245, averageRating: null },
  ],
  totalDurationSeconds: 467,
  reviews: {
    total: 3,
    pageSize: 2,
    offset: 0,
    items: [review('1'), review('2', { body: null })],
  },
};

const song: Song = {
  id: '10',
  title: 'Static Bloom',
  trackNumber: 1,
  durationSeconds: 222,
  genre: 'Dream pop',
  averageRating: null,
  ratingsCount: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  album: { id: '1', title: 'Soft Static', coverUrl: null, type: 'album', releaseYear: 2026 },
  artists: [{ id: '3', name: 'Mara Kei' }],
  reviews: { total: 0, pageSize: 10, offset: 0, items: [] },
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
  mockParams = { id: '1' };
});

describe('HU-04 · Ficha de álbum', () => {
  test('test_PA_04_01_AlbumScreen_showsInfoAverageSongsAndReviews', async () => {
    jest.mocked(getAlbum).mockResolvedValue({ ok: true, data: album });

    await render(<AlbumScreen />);

    expect(await screen.findByText('SOFT STATIC')).toBeTruthy();
    expect(screen.getByText('ÁLBUM · 2026 · DREAM POP')).toBeTruthy();
    expect(screen.getByText('MARA KEI →').props.accessibilityHint).toBe('/artista/3');
    expect(screen.getByText('4,8')).toBeTruthy();
    expect(screen.getByText('MEDIA · 1.204 VALORACIONES')).toBeTruthy();
    expect(screen.getByLabelText('5 estrellas: 72 %')).toBeTruthy();
    expect(screen.getByText('2 · 8 min')).toBeTruthy();
    expect(screen.getByText('Static Bloom').props.accessibilityHint).toBe('/cancion/10');
    expect(screen.getByText('★ 4,9')).toBeTruthy();
    expect(screen.getByText('LAS QUE PUEDES VER · 3')).toBeTruthy();
    expect(screen.getByText('Reseña 1')).toBeTruthy();
    expect(screen.getByText('VALORACIÓN RÁPIDA, SIN TEXTO')).toBeTruthy();
    expect(screen.getAllByText('hace 2 días')).toHaveLength(2);
    expect(getAlbum).toHaveBeenCalledWith('1', undefined);
  });

  test('test_AlbumScreen_withSession_sendsTokenAndShowsAvatar', async () => {
    saveSession({
      token: 'tok',
      user: { id: 1, name: 'Lucía', username: 'lucia', email: 'l@c.es', role: 'user' },
    });
    jest.mocked(getAlbum).mockResolvedValue({ ok: true, data: album });

    await render(<AlbumScreen />);

    await screen.findByText('SOFT STATIC');
    expect(getAlbum).toHaveBeenCalledWith('1', 'tok');
    expect(screen.getByLabelText('Tu perfil')).toBeTruthy();
  });

  test('test_AlbumScreen_asVisitor_offersToCreateAccount', async () => {
    jest.mocked(getAlbum).mockResolvedValue({ ok: true, data: album });

    await render(<AlbumScreen />);

    expect((await screen.findByText('CREAR CUENTA')).props.accessibilityHint).toBe('/registro');
  });

  test('test_AlbumScreen_loadMore_appendsNextPageWithoutDuplicates', async () => {
    jest.mocked(getAlbum).mockResolvedValue({ ok: true, data: album });
    jest.mocked(getReviews).mockResolvedValue({
      ok: true,
      data: { total: 3, pageSize: 2, offset: 2, items: [review('2'), review('3')] },
    });

    await render(<AlbumScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'VER MÁS RESEÑAS →' }));

    expect(await screen.findByText('Reseña 3')).toBeTruthy();
    expect(getReviews).toHaveBeenCalledWith('album', '1', 2, undefined);
    expect(screen.queryByRole('button', { name: 'VER MÁS RESEÑAS →' })).toBeNull();
  });

  test('test_AlbumScreen_loadMoreFails_showsError', async () => {
    jest.mocked(getAlbum).mockResolvedValue({ ok: true, data: album });
    jest
      .mocked(getReviews)
      .mockResolvedValue({ ok: false, notFound: false, error: 'No se ha podido cargar.' });

    await render(<AlbumScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'VER MÁS RESEÑAS →' }));

    expect(await screen.findByText('No se ha podido cargar.')).toBeTruthy();
  });

  test('test_AlbumScreen_reviewWithHtml_isShownAsPlainText', async () => {
    const attack = '<img src=x onerror="alert(1)">';
    jest.mocked(getAlbum).mockResolvedValue({
      ok: true,
      data: {
        ...album,
        reviews: { ...album.reviews, total: 1, items: [review('9', { body: attack })] },
      },
    });

    await render(<AlbumScreen />);

    expect(await screen.findByText(attack)).toBeTruthy();
  });

  test('test_AlbumScreen_notFound_showsMessageWithoutRetry', async () => {
    jest
      .mocked(getAlbum)
      .mockResolvedValue({ ok: false, notFound: true, error: 'Este álbum no existe.' });

    await render(<AlbumScreen />);

    expect(await screen.findByText('Este álbum no existe.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  test('test_AlbumScreen_connectionError_retries', async () => {
    jest
      .mocked(getAlbum)
      .mockResolvedValueOnce({ ok: false, notFound: false, error: 'Sin conexión.' })
      .mockResolvedValueOnce({ ok: true, data: album });

    await render(<AlbumScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('SOFT STATIC')).toBeTruthy();
    expect(getAlbum).toHaveBeenCalledTimes(2);
  });
});

describe('HU-04 · Ficha de canción', () => {
  test('test_PA_04_01_SongScreen_showsInfoAlbumLinkAndEmptyReviews', async () => {
    mockParams = { id: '10' };
    jest.mocked(getSong).mockResolvedValue({ ok: true, data: song });

    await render(<SongScreen />);

    expect(await screen.findByText('STATIC BLOOM')).toBeTruthy();
    expect(screen.getByText('CANCIÓN · 2026 · DREAM POP')).toBeTruthy();
    expect(screen.getByText('DEL ÁLBUM SOFT STATIC →').props.accessibilityHint).toBe('/album/1');
    expect(screen.getByText('MARA KEI →').props.accessibilityHint).toBe('/artista/3');
    expect(screen.getByText('–')).toBeTruthy();
    expect(screen.getByText('SIN VALORACIONES TODAVÍA')).toBeTruthy();
    expect(screen.getByText('3:42')).toBeTruthy();
    expect(screen.getByText('Todavía no hay reseñas que puedas ver.')).toBeTruthy();
    expect(getSong).toHaveBeenCalledWith('10', undefined);
  });
});

const artist: Artist = {
  id: '3',
  name: 'Mara Kei',
  imageUrl: null,
  genre: 'Dream pop',
  description: 'Proyecto de <b>pop</b> nacido en Valencia.',
  songsCount: 1234,
  albums: [
    {
      id: '1',
      title: 'Soft Static',
      coverUrl: null,
      type: 'album',
      releaseYear: 2026,
      averageRating: 4.8,
    },
    {
      id: '2',
      title: 'Primeras cintas',
      coverUrl: null,
      type: 'ep',
      releaseYear: 2022,
      averageRating: null,
    },
  ],
};

describe('HU-59 · Ficha de artista', () => {
  test('test_PA_59_01_ArtistScreen_showsInfoAndAlbums', async () => {
    mockParams = { id: '3' };
    jest.mocked(getArtist).mockResolvedValue({ ok: true, data: artist });

    await render(<ArtistScreen />);

    expect(await screen.findByText('MARA KEI')).toBeTruthy();
    expect(screen.getByText('ARTISTA · DREAM POP')).toBeTruthy();
    expect(screen.getByText('Proyecto de <b>pop</b> nacido en Valencia.')).toBeTruthy();
    expect(screen.getByText('1.234')).toBeTruthy();
    expect(screen.getByText('ÁLBUMES · 1')).toBeTruthy();
    expect(screen.getByText('EPS · 1')).toBeTruthy();
    expect(screen.queryByText(/SINGLES/)).toBeNull();
    expect(screen.getByText('Soft Static').props.accessibilityHint).toBe('/album/1');
    expect(screen.getByText('2026 · ★ 4,8')).toBeTruthy();
    expect(screen.getByText('2022')).toBeTruthy();
    expect(getArtist).toHaveBeenCalledWith('3');
  });

  test('test_ArtistScreen_withoutAlbums_saysSo', async () => {
    jest.mocked(getArtist).mockResolvedValue({
      ok: true,
      data: { ...artist, albums: [], description: null },
    });

    await render(<ArtistScreen />);

    expect(
      await screen.findByText('Todavía no hay discos de este artista en el catálogo.'),
    ).toBeTruthy();
  });

  test('test_ArtistScreen_notFound_showsMessage', async () => {
    jest
      .mocked(getArtist)
      .mockResolvedValue({ ok: false, notFound: true, error: 'Este artista no existe.' });

    await render(<ArtistScreen />);

    expect(await screen.findByText('Este artista no existe.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  test('test_ArtistScreen_connectionError_retries', async () => {
    jest
      .mocked(getArtist)
      .mockResolvedValueOnce({ ok: false, notFound: false, error: 'Sin conexión.' })
      .mockResolvedValueOnce({ ok: true, data: artist });

    await render(<ArtistScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('MARA KEI')).toBeTruthy();
  });
});

test('test_SongScreen_fromAnEp_namesItAsEp', async () => {
  mockParams = { id: '10' };
  jest.mocked(getSong).mockResolvedValue({
    ok: true,
    data: { ...song, album: { ...song.album, type: 'ep', title: 'Primeras cintas' } },
  });

  await render(<SongScreen />);

  expect(await screen.findByText('DEL EP PRIMERAS CINTAS →')).toBeTruthy();
  expect(screen.getByText('EP')).toBeTruthy();
});
