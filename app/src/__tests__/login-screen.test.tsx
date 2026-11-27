import { fireEvent, render, screen } from '@testing-library/react-native';

import LoginScreen from '../app/acceso';
import { loginUser } from '../services/auth-api';
import { clearSession, getSession } from '../services/session';

const mockRouter = { replace: jest.fn() };
let mockParams: { aviso?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText accessibilityHint={href}>{children}</MockText>;
  },
}));
jest.mock('../services/auth-api', () => ({ loginUser: jest.fn() }));
jest.mock('react-native-svg', () => ({ SvgXml: () => null }));

const session = {
  token: 't',
  user: { id: 1, name: 'Lucía', username: 'lucia.m', email: 'l@c.es', role: 'user' },
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
  mockParams = {};
});

async function fill(login: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Correo o nombre de usuario'), login);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

test('test_LoginScreen_showsHertzAccesoTexts', async () => {
  await render(<LoginScreen />);

  expect(screen.getByText('HOLA DE NUEVO')).toBeTruthy();
  expect(screen.getByText('Créala aquí').props.accessibilityHint).toBe('/registro');
});

test('test_LoginScreen_withEmptyFields_showsErrorsWithoutCallingApi', async () => {
  await render(<LoginScreen />);

  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  expect(screen.getByText('Escribe tu correo o tu nombre de usuario.')).toBeTruthy();
  expect(screen.getByText('Escribe tu contraseña.')).toBeTruthy();
  expect(loginUser).not.toHaveBeenCalled();
});

test('test_PA_02_01_LoginScreen_rightCredentials_savesSessionAndGoesHome', async () => {
  jest.mocked(loginUser).mockResolvedValue({ ok: true, session });
  await render(<LoginScreen />);

  await fill('  lucia.m ', 'secreta123');

  expect(loginUser).toHaveBeenCalledWith({ login: 'lucia.m', password: 'secreta123' });
  expect(getSession()).toEqual(session);
  expect(mockRouter.replace).toHaveBeenCalledWith('/inicio');
});

test('test_PA_02_02_LoginScreen_wrongCredentials_showsErrorAndStays', async () => {
  jest.mocked(loginUser).mockResolvedValue({
    ok: false,
    errors: { general: 'El usuario o la contraseña no son correctos.' },
  });
  await render(<LoginScreen />);

  await fill('lucia.m', 'mala');

  expect(await screen.findByText('El usuario o la contraseña no son correctos.')).toBeTruthy();
  expect(getSession()).toBeNull();
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

test('test_PA_02_03_LoginScreen_suspended_showsReason', async () => {
  jest.mocked(loginUser).mockResolvedValue({
    ok: false,
    suspended: true,
    errors: { general: 'Tu cuenta está suspendida. Motivo: Spam' },
  });
  await render(<LoginScreen />);

  await fill('lucia.m', 'secreta123');

  expect(await screen.findByText('Tu cuenta está suspendida. Motivo: Spam')).toBeTruthy();
  expect(getSession()).toBeNull();
});

test('test_PA_02_04_LoginScreen_afterExpiredSession_explainsWhy', async () => {
  mockParams = { aviso: 'caducada' };
  await render(<LoginScreen />);

  expect(screen.getByText('Tu sesión ha caducado. Inicia sesión de nuevo.')).toBeTruthy();
});

test('test_PA_17_01_LoginScreen_afterLogOut_saysSo', async () => {
  mockParams = { aviso: 'cerrada' };
  await render(<LoginScreen />);

  expect(
    screen.getByText('Has cerrado sesión. Puedes seguir como visitante o volver a entrar.'),
  ).toBeTruthy();
});

test('test_LoginScreen_unknownNotice_isIgnored', async () => {
  mockParams = { aviso: '<script>alert(1)</script>' };
  await render(<LoginScreen />);

  expect(screen.queryByText('<script>alert(1)</script>')).toBeNull();
});

test('test_LoginScreen_createAccountTab_goesToRegister', async () => {
  await render(<LoginScreen />);

  await fireEvent.press(screen.getByRole('tab', { name: 'CREAR CUENTA' }));

  expect(mockRouter.replace).toHaveBeenCalledWith('/registro');
});
