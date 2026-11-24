import { fireEvent, render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/inicio';
import WelcomeScreen from '../app/index';
import RegisterScreen from '../app/registro';
import { registerUser } from '../services/api';
import { clearSession, getSession, saveSession } from '../services/session';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Redirect: ({ href }: { href: string }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText>Redirige a {href}</MockText>;
  },
}));
jest.mock('../services/api', () => ({ registerUser: jest.fn() }));

const session = {
  token: 't',
  user: { id: 1, name: 'Lucía Moreno', username: 'lucia.m', email: 'l@c.es', role: 'user' },
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
});

async function fillValidForm() {
  await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Lucía Moreno');
  await fireEvent.changeText(screen.getByLabelText('Nombre de usuario'), 'lucia.m');
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'lucia@correo.es');
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secreta123');
  await fireEvent.press(
    screen.getByLabelText('Acepto las condiciones de uso y la política de privacidad'),
  );
}

describe('A01 · Bienvenida', () => {
  test('test_WelcomeScreen_whenPressingCreateAccount_goesToRegister', async () => {
    await render(<WelcomeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/registro');
    expect(screen.getByText('Reseña, valora y comparte la música que te mueve')).toBeTruthy();
  });
});

describe('A02 / A03 · Registro', () => {
  test('test_RegisterScreen_withEmptyForm_showsErrorsWithoutCallingApi', async () => {
    await render(<RegisterScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(screen.getByText('Escribe tu nombre.')).toBeTruthy();
    expect(
      screen.getByText('Tienes que aceptar las condiciones de uso y la política de privacidad.'),
    ).toBeTruthy();
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('test_RegisterScreen_whileTypingPassword_updatesRequirements', async () => {
    await render(<RegisterScreen />);
    expect(screen.getByText('✗ Al menos un número')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'abc1');

    expect(screen.getByText('✓ Al menos un número')).toBeTruthy();
    expect(screen.getByText('✓ Al menos una letra')).toBeTruthy();
    expect(screen.getByText('✗ Mínimo 8 caracteres')).toBeTruthy();
  });

  test('test_RegisterScreen_withValidData_savesSessionAndGoesHome', async () => {
    jest.mocked(registerUser).mockResolvedValue({ ok: true, session });
    await render(<RegisterScreen />);
    await fillValidForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(registerUser).toHaveBeenCalledWith({
      name: 'Lucía Moreno',
      username: 'lucia.m',
      email: 'lucia@correo.es',
      password: 'secreta123',
      acceptedTerms: true,
    });
    expect(getSession()).toEqual(session);
    expect(mockRouter.replace).toHaveBeenCalledWith('/inicio');
  });

  test('test_RegisterScreen_withTakenUsername_showsMessageUnderTheField', async () => {
    const message = 'Este nombre de usuario ya está en uso. Prueba con otro.';
    jest.mocked(registerUser).mockResolvedValue({ ok: false, errors: { username: message } });
    await render(<RegisterScreen />);
    await fillValidForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Nombre de usuario'), 'lucia.moreno');
    expect(screen.queryByText(message)).toBeNull();
  });

  test('test_RegisterScreen_whenPressingShowPassword_revealsIt', async () => {
    await render(<RegisterScreen />);
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  test('test_RegisterScreen_whenApiIsUnreachable_showsGeneralError', async () => {
    jest
      .mocked(registerUser)
      .mockResolvedValue({ ok: false, errors: { general: 'No se ha podido conectar' } });
    await render(<RegisterScreen />);
    await fillValidForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('No se ha podido conectar')).toBeTruthy();
  });
});

describe('Inicio tras registrarse', () => {
  test('test_HomeScreen_withSession_greetsTheUser', async () => {
    saveSession(session);

    await render(<HomeScreen />);

    expect(screen.getByText('¡Hola, Lucía Moreno!')).toBeTruthy();
  });

  test('test_HomeScreen_withoutSession_redirectsToWelcome', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Redirige a /')).toBeTruthy();
  });
});
