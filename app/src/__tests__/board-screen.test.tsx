// Tablero abierto: HU-25, HU-49, HU-26, HU-50 y HU-34 desde la app. HU-25 desde la ficha.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import BoardScreen from '../app/tablero/[id]';
import { AddToBoardButton } from '../components/AddToBoardButton';
import { NewBoard } from '../components/NewBoard';
import {
  addToBoard,
  createBoard,
  deleteBoard,
  getBoard,
  getMyBoardsFor,
  removeFromBoard,
  updateBoard,
  type Board,
} from '../services/boards-api';
import { search } from '../services/api';
import { clearSession, saveSession } from '../services/session';

const mockRouter = { replace: jest.fn(), push: jest.fn(), setParams: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: '5' }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText accessibilityHint={href}>{children}</MockText>;
  },
}));
jest.mock('../services/boards-api', () => ({
  getBoard: jest.fn(),
  updateBoard: jest.fn(),
  deleteBoard: jest.fn(),
  addToBoard: jest.fn(),
  removeFromBoard: jest.fn(),
  getMyBoardsFor: jest.fn(),
  createBoard: jest.fn(),
}));
jest.mock('../services/api', () => ({ search: jest.fn() }));
jest.mock('react-native-svg', () => ({ SvgXml: () => null }));

const session = {
  token: 'tok',
  user: { id: 1, name: 'Lucía', username: 'lucia', email: 'l@c.es', role: 'user' },
};

const board: Board = {
  id: '5',
  name: 'Carretera de noche',
  description: 'Para conducir',
  privacy: 'public',
  coverItemId: null,
  coverUrl: null,
  createdAt: new Date().toISOString(),
  isOwner: true,
  owner: { username: 'lucia', name: 'Lucía', photoUrl: null },
  itemsCount: 2,
  followersCount: 37,
  items: [
    {
      id: '11',
      kind: 'album',
      catalogId: '7',
      title: 'Soft Static',
      coverUrl: null,
      albumType: 'album',
      artists: [{ id: '1', name: 'Nora Eco' }],
      myRating: 4,
      addedAt: new Date().toISOString(),
    },
    {
      id: '12',
      kind: 'song',
      catalogId: '3',
      title: 'Luz de freno',
      coverUrl: null,
      albumType: 'single',
      artists: [{ id: '2', name: 'Los Faros' }],
      myRating: null,
      addedAt: new Date().toISOString(),
    },
  ],
};

const failure = (errors: Record<string, string>, extra = {}) => ({
  ok: false as const,
  errors,
  needsLogin: false,
  notFound: false,
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
});

test('test_owner_seesTheBoard_andItsOptions', async () => {
  saveSession(session);
  jest.mocked(getBoard).mockResolvedValue({ ok: true, data: board });
  await render(<BoardScreen />);

  expect(await screen.findByText('CARRETERA DE NOCHE')).toBeTruthy();
  expect(getBoard).toHaveBeenCalledWith('5', 'tok');
  expect(screen.getByText('TABLERO DE @LUCIA · 2 ELEMENTOS · 37 SEGUIDORES')).toBeTruthy();
  expect(screen.getByText('← Mis tableros')).toBeTruthy();
  expect(screen.getByText('01')).toBeTruthy();
  expect(screen.getByText(/TU NOTA ★★★★☆/)).toBeTruthy();
  expect(screen.getByText('CANCIÓN')).toBeTruthy();
  expect(screen.getByLabelText('+ Añadir canción o álbum')).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'PÚBLICO' }).props.accessibilityState.checked).toBe(
    true,
  );
});

test('test_PA_34_01_changePrivacy_appliesNow', async () => {
  saveSession(session);
  jest.mocked(getBoard).mockResolvedValue({ ok: true, data: board });
  jest.mocked(updateBoard).mockResolvedValue({ ok: true, data: { ...board, privacy: 'friends' } });
  await render(<BoardScreen />);

  await fireEvent.press(await screen.findByRole('radio', { name: 'SOLO AMIGOS' }));

  await waitFor(() =>
    expect(
      screen.getByRole('radio', { name: 'SOLO AMIGOS' }).props.accessibilityState.checked,
    ).toBe(true),
  );
  expect(updateBoard).toHaveBeenCalledWith('tok', '5', { privacy: 'friends' });
});

test('test_PA_26_01_03_edit_nameDescriptionAndCover', async () => {
  saveSession(session);
  jest.mocked(getBoard).mockResolvedValue({ ok: true, data: board });
  jest.mocked(updateBoard).mockResolvedValue({ ok: true, data: { ...board, name: 'Noche' } });
  await render(<BoardScreen />);

  await fireEvent.press(await screen.findByLabelText('Editar'));
  await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Noche');
  await fireEvent.press(screen.getByLabelText('Portada: Luz de freno'));
  await fireEvent.press(screen.getByLabelText('Guardar cambios'));

  expect(await screen.findByText('NOCHE')).toBeTruthy();
  expect(updateBoard).toHaveBeenCalledWith('tok', '5', {
    name: 'Noche',
    description: 'Para conducir',
    coverItemId: '12',
  });
});

test('test_RN_14_edit_withoutName_warnsBeforeSending', async () => {
  saveSession(session);
  jest.mocked(getBoard).mockResolvedValue({ ok: true, data: board });
  await render(<BoardScreen />);

  await fireEvent.press(await screen.findByLabelText('Editar'));
  await fireEvent.changeText(screen.getByLabelText('Nombre'), '   ');
  await fireEvent.press(screen.getByLabelText('Guardar cambios'));

  expect(screen.getByText('Ponle un nombre al tablero.')).toBeTruthy();
  expect(updateBoard).not.toHaveBeenCalled();
});

test('test_PA_50_01_delete_asksFirst_andGoesBackToMyBoards', async () => {
  saveSession(session);
  jest.mocked(getBoard).mockResolvedValue({ ok: true, data: board });
  jest.mocked(deleteBoard).mockResolvedValue({ ok: true, data: { deleted: true } });
  await render(<BoardScreen />);

  await fireEvent.press(await screen.findByLabelText('•••'));
  expect(screen.getByText(/No se puede deshacer/)).toBeTruthy();
  expect(deleteBoard).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('Sí, eliminar tablero'));

  await waitFor(() =>
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/perfil',
      params: { carpeta: 'tableros' },
    }),
  );
  expect(deleteBoard).toHaveBeenCalledWith('tok', '5');
});

test('test_PA_49_01_removeItem_reloadsTheBoard', async () => {
  saveSession(session);
  jest
    .mocked(getBoard)
    .mockResolvedValueOnce({ ok: true, data: board })
    .mockResolvedValueOnce({
      ok: true,
      data: { ...board, itemsCount: 1, items: [board.items[0]] },
    });
  jest.mocked(removeFromBoard).mockResolvedValue({ ok: true, data: { deleted: true } });
  await render(<BoardScreen />);

  await fireEvent.press(await screen.findByLabelText('Quitar Luz de freno del tablero'));

  await waitFor(() => expect(screen.queryByText('Luz de freno')).toBeNull());
  expect(removeFromBoard).toHaveBeenCalledWith('tok', '5', '12');
});

test('test_PA_25_01_02_addFromTheBoard_marksWhatIsAlreadyThere', async () => {
  saveSession(session);
  jest.mocked(getBoard).mockResolvedValue({ ok: true, data: board });
  jest.mocked(search).mockResolvedValue({
    ok: true,
    data: {
      query: 'luz',
      songs: [
        {
          id: '3',
          title: 'Luz de freno',
          albumId: '1',
          albumTitle: 'x',
          coverUrl: null,
          artists: [],
        },
        {
          id: '4',
          title: 'Luz de neón',
          albumId: '1',
          albumTitle: 'x',
          coverUrl: null,
          artists: [],
        },
      ],
      albums: [],
      artists: [],
      users: [],
      communities: [],
    },
  });
  jest.mocked(addToBoard).mockResolvedValue({ ok: true, data: { id: '30' } });
  await render(<BoardScreen />);

  await fireEvent.press(await screen.findByLabelText('+ Añadir canción o álbum'));
  await fireEvent.changeText(screen.getByLabelText('Buscar canciones o álbumes'), 'luz');

  expect(await screen.findByLabelText('Luz de freno ya está en el tablero')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Añadir Luz de neón al tablero'));
  await waitFor(() =>
    expect(addToBoard).toHaveBeenCalledWith('tok', '5', { kind: 'song', id: '4' }),
  );
  expect(getBoard).toHaveBeenCalledTimes(2);
});

test('test_RN_13_othersOnlySeeIt_withoutOptions', async () => {
  jest.mocked(getBoard).mockResolvedValue({
    ok: true,
    data: { ...board, isOwner: false, privacy: undefined, coverItemId: undefined },
  });
  await render(<BoardScreen />);

  expect(await screen.findByText('CARRETERA DE NOCHE')).toBeTruthy();
  expect(getBoard).toHaveBeenCalledWith('5', undefined);
  expect(screen.getByText('← Perfil de @lucia')).toBeTruthy();
  expect(screen.queryByLabelText('Editar')).toBeNull();
  expect(screen.queryByRole('radio')).toBeNull();
  expect(screen.queryByLabelText('Quitar Luz de freno del tablero')).toBeNull();
});

test('test_PA_34_02_notVisible_saysItIsNotAvailable', async () => {
  jest.mocked(getBoard).mockResolvedValue(failure({ form: 'x' }, { notFound: true }));
  await render(<BoardScreen />);
  expect(await screen.findByText('Este tablero no está disponible.')).toBeTruthy();
  expect(screen.queryByLabelText('Reintentar')).toBeNull();
});

test('test_security_userTextIsShownAsText', async () => {
  saveSession(session);
  const name = '<img src=x onerror=alert(1)>';
  jest.mocked(getBoard).mockResolvedValue({ ok: true, data: { ...board, description: name } });
  await render(<BoardScreen />);
  expect(await screen.findByText(name)).toBeTruthy();
});

describe('HU-09 · + Nuevo tablero', () => {
  test('test_PA_09_01_02_create_withoutChoosingPrivacy_usesMyDefault', async () => {
    saveSession(session);
    jest.mocked(createBoard).mockResolvedValue({ ok: true, data: { id: '9' } });
    await render(<NewBoard onExpired={jest.fn()} />);

    await fireEvent.press(screen.getByLabelText('+ Nuevo tablero'));
    expect(screen.getByText('Si no eliges, se usa tu privacidad por defecto.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Domingos');
    await fireEvent.press(screen.getByLabelText('Crear tablero'));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/tablero/9'));
    expect(createBoard).toHaveBeenCalledWith('tok', { name: 'Domingos', description: '' });
  });

  test('test_PA_09_03_withoutName_isNotSent_andApiErrorsAreShown', async () => {
    saveSession(session);
    jest.mocked(createBoard).mockResolvedValue(failure({ description: 'Demasiado larga.' }));
    await render(<NewBoard onExpired={jest.fn()} />);

    await fireEvent.press(screen.getByLabelText('+ Nuevo tablero'));
    await fireEvent.press(screen.getByLabelText('Crear tablero'));
    expect(screen.getByText('Ponle un nombre al tablero.')).toBeTruthy();
    expect(createBoard).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Domingos');
    await fireEvent.press(screen.getByRole('radio', { name: 'PRIVADO' }));
    await fireEvent.press(screen.getByLabelText('Crear tablero'));
    expect(await screen.findByText('Demasiado larga.')).toBeTruthy();
    expect(createBoard).toHaveBeenCalledWith('tok', {
      name: 'Domingos',
      description: '',
      privacy: 'private',
    });
  });
});

describe('HU-25 · + A un tablero en la ficha', () => {
  test('test_visitor_isAskedToLogIn', async () => {
    await render(<AddToBoardButton kind="song" id="3" />);
    await fireEvent.press(screen.getByLabelText('Añadir a un tablero'));
    expect(screen.getByText('inicia sesión')).toBeTruthy();
    expect(getMyBoardsFor).not.toHaveBeenCalled();
  });

  test('test_PA_25_01_02_addsToABoard_andMarksWhereItAlreadyIs', async () => {
    saveSession(session);
    jest.mocked(getMyBoardsFor).mockResolvedValue({
      ok: true,
      data: {
        items: [
          { id: '5', name: 'Carretera', privacy: 'public', contains: true },
          { id: '6', name: 'Domingos', privacy: 'private', contains: false },
        ],
      },
    });
    jest.mocked(addToBoard).mockResolvedValue({ ok: true, data: { id: '20' } });
    await render(<AddToBoardButton kind="song" id="3" />);

    await fireEvent.press(screen.getByLabelText('Añadir a un tablero'));
    expect(await screen.findByLabelText('Ya está en Carretera')).toBeTruthy();
    expect(screen.queryByLabelText('Añadir a Carretera')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Añadir a Domingos'));

    expect(await screen.findByText('Añadido')).toBeTruthy();
    expect(screen.getByLabelText('Ya está en Domingos')).toBeTruthy();
    expect(addToBoard).toHaveBeenCalledWith('tok', '6', { kind: 'song', id: '3' });
  });

  test('test_noBoardsYet_pointsToTheProfile', async () => {
    saveSession(session);
    jest.mocked(getMyBoardsFor).mockResolvedValue({ ok: true, data: { items: [] } });
    await render(<AddToBoardButton kind="album" id="7" />);
    await fireEvent.press(screen.getByLabelText('Añadir a un tablero'));
    expect(await screen.findByText('Crea uno en tu perfil')).toBeTruthy();
  });
});
