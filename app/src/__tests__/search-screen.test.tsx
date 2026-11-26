import { act, fireEvent, render, screen } from '@testing-library/react-native';

import SearchScreen from '../app/buscar';
import { search, type SearchResults } from '../services/api';
import { clearSession, saveSession } from '../services/session';

let mockParams: { q?: string } = {};
const mockRouter = { setParams: jest.fn() };

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText accessibilityHint={href}>{children}</MockText>;
  },
}));
jest.mock('../services/api', () => ({ search: jest.fn() }));

const results: SearchResults = {
  query: 'luz',
  songs: [
    {
      id: '10',
      title: 'Luz de neón',
      albumId: '1',
      albumTitle: 'Luz de Neón',
      coverUrl: null,
      artists: [{ id: '3', name: 'Las Polillas' }],
    },
  ],
  albums: [
    {
      id: '1',
      title: 'Luz de Neón',
      type: 'ep',
      releaseYear: 2025,
      coverUrl: null,
      artists: [{ id: '3', name: 'Las Polillas' }],
    },
  ],
  artists: [{ id: '3', name: 'Luzia', genre: 'Pop', imageUrl: null }],
  users: [{ username: 'luz.m', name: 'Luz Martín', photoUrl: null }],
  communities: [{ id: '4', name: 'Luces de ciudad', access: 'private', membersCount: 1 }],
};

const empty: SearchResults = {
  query: 'zzz',
  songs: [],
  albums: [],
  artists: [],
  users: [],
  communities: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
  mockParams = {};
});

test('test_SearchScreen_withoutTerm_showsFormWithoutSearching', async () => {
  await render(<SearchScreen />);

  expect(screen.getByText('¿QUÉ BUSCAS?')).toBeTruthy();
  expect(screen.getByLabelText('Término de búsqueda')).toBeTruthy();
  expect(search).not.toHaveBeenCalled();
});

test('test_SearchScreen_submit_putsTermInAddress', async () => {
  await render(<SearchScreen />);

  await fireEvent.changeText(screen.getByLabelText('Término de búsqueda'), '  luz  ');
  await fireEvent.press(screen.getByRole('button', { name: 'Buscar' }));

  expect(mockRouter.setParams).toHaveBeenCalledWith({ q: 'luz' });
});

test('test_SearchScreen_tooShortTerm_showsHintWithoutSearching', async () => {
  await render(<SearchScreen />);

  await fireEvent.changeText(screen.getByLabelText('Término de búsqueda'), 'l');
  await fireEvent.press(screen.getByRole('button', { name: 'Buscar' }));

  expect(screen.getByText('Escribe al menos 2 caracteres.')).toBeTruthy();
  expect(mockRouter.setParams).not.toHaveBeenCalled();
});

test('test_PA_03_01_SearchScreen_showsResultsByCategoryWithLinks', async () => {
  mockParams = { q: 'luz' };
  jest.mocked(search).mockResolvedValue({ ok: true, data: results });

  await render(<SearchScreen />);

  expect(await screen.findByText('CANCIONES · 1')).toBeTruthy();
  expect(screen.getByText('ÁLBUMES, EPS Y SINGLES · 1')).toBeTruthy();
  expect(screen.getByText('ARTISTAS · 1')).toBeTruthy();
  expect(screen.getByText('USUARIOS · 1')).toBeTruthy();
  expect(screen.getByText('COMUNIDADES · 1')).toBeTruthy();
  expect(screen.getByText('Luz de neón').props.accessibilityHint).toBe('/cancion/10');
  expect(screen.getByText('Luz de Neón').props.accessibilityHint).toBe('/album/1');
  expect(screen.getByText('Luzia').props.accessibilityHint).toBe('/artista/3');
  expect(screen.getByText('LAS POLILLAS · LUZ DE NEÓN')).toBeTruthy();
  expect(screen.getByText('EP · 2025 · LAS POLILLAS')).toBeTruthy();
  expect(screen.getByText('@luz.m')).toBeTruthy();
  expect(screen.getByText('PRIVADA · 1 MIEMBRO')).toBeTruthy();
  expect(search).toHaveBeenCalledWith('luz', undefined);
});

test('test_SearchScreen_withSession_sendsToken', async () => {
  saveSession({
    token: 'tok',
    user: { id: 1, name: 'Lucía', username: 'lucia', email: 'l@c.es', role: 'user' },
  });
  mockParams = { q: 'luz' };
  jest.mocked(search).mockResolvedValue({ ok: true, data: results });

  await render(<SearchScreen />);

  await screen.findByText('CANCIONES · 1');
  expect(search).toHaveBeenCalledWith('luz', 'tok');
});

test('test_PA_03_02_SearchScreen_withoutMatches_saysThereAreNoResults', async () => {
  mockParams = { q: 'zzz' };
  jest.mocked(search).mockResolvedValue({ ok: true, data: empty });

  await render(<SearchScreen />);

  expect(
    await screen.findByText('No hay resultados para «zzz». Prueba con otras palabras.'),
  ).toBeTruthy();
});

test('test_SearchScreen_whenSearchFails_showsError', async () => {
  mockParams = { q: 'luz' };
  jest.mocked(search).mockResolvedValue({ ok: false, error: 'No se ha podido conectar.' });

  await render(<SearchScreen />);

  expect(await screen.findByText('No se ha podido conectar.')).toBeTruthy();
});

describe('Búsqueda mientras se escribe', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('test_SearchScreen_typingThreeLetters_searchesAfterAPause', async () => {
    await render(<SearchScreen />);

    await fireEvent.changeText(screen.getByLabelText('Término de búsqueda'), 'luz');
    expect(mockRouter.setParams).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(350));

    expect(mockRouter.setParams).toHaveBeenCalledWith({ q: 'luz' });
  });

  test('test_SearchScreen_typingFast_searchesOnlyTheLastText', async () => {
    await render(<SearchScreen />);
    const input = screen.getByLabelText('Término de búsqueda');

    await fireEvent.changeText(input, 'luz');
    await act(() => jest.advanceTimersByTime(200));
    await fireEvent.changeText(input, 'luz d');
    await act(() => jest.advanceTimersByTime(200));
    await fireEvent.changeText(input, 'luz de');
    await act(() => jest.advanceTimersByTime(350));

    expect(mockRouter.setParams).toHaveBeenCalledTimes(1);
    expect(mockRouter.setParams).toHaveBeenCalledWith({ q: 'luz de' });
  });

  test('test_SearchScreen_typingTwoLetters_doesNotSearchYet', async () => {
    await render(<SearchScreen />);

    await fireEvent.changeText(screen.getByLabelText('Término de búsqueda'), 'lu');
    await act(() => jest.advanceTimersByTime(1000));

    expect(mockRouter.setParams).not.toHaveBeenCalled();
  });
});

test('test_SearchScreen_newSearch_keepsPreviousResultsWhileLoading', async () => {
  mockParams = { q: 'luz' };
  jest.mocked(search).mockResolvedValueOnce({ ok: true, data: results });
  const { rerender } = await render(<SearchScreen />);
  await screen.findByText('CANCIONES · 1');

  jest.mocked(search).mockReturnValueOnce(new Promise(() => {}));
  mockParams = { q: 'luz de' };
  await rerender(<SearchScreen />);

  expect(screen.getByText('CANCIONES · 1')).toBeTruthy();
  expect(screen.getByLabelText('Buscando')).toBeTruthy();
});
