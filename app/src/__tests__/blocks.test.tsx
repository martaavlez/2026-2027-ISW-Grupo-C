// HU-35 · Bloquear a un usuario y HU-56 · Desbloquearlo, desde la app.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { BlockButton } from '../components/BlockButton';
import { BlockedList } from '../components/BlockedList';
import { blockUser, getBlocked, unblockUser } from '../services/blocks-api';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText>{children}</MockText>;
  },
}));
jest.mock('../services/blocks-api', () => ({
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
  getBlocked: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

test('test_PA_35_01_block_asksFirst_thenBlocks', async () => {
  const onBlocked = jest.fn();
  jest.mocked(blockUser).mockResolvedValue({ ok: true, data: { blocked: true } });
  await render(
    <BlockButton username="bea" token="tok" onBlocked={onBlocked} onExpired={jest.fn()} />,
  );

  await fireEvent.press(screen.getByLabelText('Bloquear a @bea'));
  expect(screen.getByText(/Dejará de ver tu perfil/)).toBeTruthy();
  expect(blockUser).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('Sí, bloquear'));

  await waitFor(() => expect(onBlocked).toHaveBeenCalled());
  expect(blockUser).toHaveBeenCalledWith('bea', 'tok');
});

test('test_block_canBeCancelled_andErrorsAreShown', async () => {
  jest
    .mocked(blockUser)
    .mockResolvedValue({
      ok: false,
      error: 'Has hecho muchos cambios seguidos.',
      needsLogin: false,
    });
  await render(
    <BlockButton username="bea" token="tok" onBlocked={jest.fn()} onExpired={jest.fn()} />,
  );
  await fireEvent.press(screen.getByLabelText('Bloquear a @bea'));
  await fireEvent.press(screen.getByLabelText('Cancelar'));
  expect(screen.queryByText(/Dejará de ver tu perfil/)).toBeNull();

  await fireEvent.press(screen.getByLabelText('Bloquear a @bea'));
  await fireEvent.press(screen.getByLabelText('Sí, bloquear'));
  expect(await screen.findByText('Has hecho muchos cambios seguidos.')).toBeTruthy();
});

test('test_PA_56_01_unblock_fromMyBlockedList', async () => {
  const onChanged = jest.fn();
  jest
    .mocked(getBlocked)
    .mockResolvedValueOnce({
      ok: true,
      data: {
        total: 1,
        offset: 0,
        pageSize: 24,
        items: [{ username: 'bea', name: 'Bea', photoUrl: null, since: '2026-11-01' }],
      },
    })
    .mockResolvedValueOnce({ ok: true, data: { total: 0, offset: 0, pageSize: 24, items: [] } });
  jest.mocked(unblockUser).mockResolvedValue({ ok: true, data: { blocked: false } });
  await render(<BlockedList token="tok" onExpired={jest.fn()} onChanged={onChanged} />);

  expect(await screen.findByText(/BLOQUEADOS/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Desbloquear a @bea'));

  await waitFor(() => expect(screen.queryByText('@bea')).toBeNull());
  expect(unblockUser).toHaveBeenCalledWith('bea', 'tok');
  expect(onChanged).toHaveBeenCalled();
});

test('test_blockedList_empty_showsNothing', async () => {
  jest
    .mocked(getBlocked)
    .mockResolvedValue({ ok: true, data: { total: 0, offset: 0, pageSize: 24, items: [] } });
  await render(<BlockedList token="tok" onExpired={jest.fn()} onChanged={jest.fn()} />);
  await waitFor(() => expect(getBlocked).toHaveBeenCalled());
  expect(screen.queryByText(/BLOQUEADOS/)).toBeNull();
});
