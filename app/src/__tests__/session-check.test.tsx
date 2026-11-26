import { render, waitFor } from '@testing-library/react-native';

import { SessionCheck } from '../components/SessionCheck';
import { checkSession } from '../services/auth-api';
import { clearSession, getSession, saveSession } from '../services/session';

const mockRouter = { replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../services/auth-api', () => ({ checkSession: jest.fn() }));

const session = {
  token: 'tok',
  user: { id: 1, name: 'Lucía', username: 'lucia', email: 'l@c.es', role: 'user' },
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSession();
});

test('test_SessionCheck_withoutSession_doesNothing', async () => {
  await render(<SessionCheck />);
  expect(checkSession).not.toHaveBeenCalled();
});

test('test_SessionCheck_validSession_keepsIt', async () => {
  saveSession(session);
  jest.mocked(checkSession).mockResolvedValue({ status: 'valid', user: session.user });

  await render(<SessionCheck />);

  await waitFor(() => expect(checkSession).toHaveBeenCalledWith('tok'));
  expect(getSession()).toEqual(session);
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

test('test_PA_02_04_SessionCheck_invalidToken_clearsAndAsksToLogIn', async () => {
  saveSession(session);
  jest.mocked(checkSession).mockResolvedValue({ status: 'invalid' });

  await render(<SessionCheck />);

  await waitFor(() =>
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/acceso',
      params: { aviso: 'caducada' },
    }),
  );
  expect(getSession()).toBeNull();
});

test('test_SessionCheck_suspendedAccount_clearsSession', async () => {
  saveSession(session);
  jest.mocked(checkSession).mockResolvedValue({ status: 'suspended', message: 'x' });

  await render(<SessionCheck />);

  await waitFor(() =>
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/acceso',
      params: { aviso: 'suspendida' },
    }),
  );
  expect(getSession()).toBeNull();
});

test('test_SessionCheck_offline_keepsSession', async () => {
  saveSession(session);
  jest.mocked(checkSession).mockResolvedValue({ status: 'offline' });

  await render(<SessionCheck />);

  await waitFor(() => expect(checkSession).toHaveBeenCalled());
  expect(getSession()).toEqual(session);
});
