// HU-10 · Seguir a un usuario y HU-48 · Dejar de seguirlo, desde la app.
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { FollowButton } from '../components/FollowButton';
import { FollowingList } from '../components/FollowingList';
import { followUser, getFollowing, unfollowUser } from '../services/follows-api';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => {
    const { Text: MockText } = jest.requireActual('react-native');
    return <MockText>{children}</MockText>;
  },
}));
jest.mock('../services/follows-api', () => ({
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
  getFollowing: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

test('test_PA_10_01_follow_withOneTap', async () => {
  const onChange = jest.fn();
  jest.mocked(followUser).mockResolvedValue({ ok: true, data: { following: true, followers: 4 } });
  await render(
    <FollowButton
      username="bea"
      following={false}
      token="tok"
      onChange={onChange}
      onExpired={jest.fn()}
    />,
  );

  await fireEvent.press(screen.getByLabelText('Seguir a @bea'));

  await waitFor(() => expect(onChange).toHaveBeenCalledWith({ following: true, followers: 4 }));
  expect(followUser).toHaveBeenCalledWith('bea', 'tok');
});

test('test_PA_48_01_unfollow_fromTheProfile', async () => {
  const onChange = jest.fn();
  jest
    .mocked(unfollowUser)
    .mockResolvedValue({ ok: true, data: { following: false, followers: 3 } });
  await render(
    <FollowButton username="bea" following token="tok" onChange={onChange} onExpired={jest.fn()} />,
  );
  expect(screen.getByText('✓ Siguiendo · Dejar de seguir')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Dejar de seguir a @bea'));

  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(unfollowUser).toHaveBeenCalledWith('bea', 'tok');
});

test('test_follow_errors_areShown_andExpiredSessionGoesToLogin', async () => {
  const onExpired = jest.fn();
  jest
    .mocked(followUser)
    .mockResolvedValueOnce({
      ok: false,
      error: 'Este perfil no está disponible.',
      needsLogin: false,
    })
    .mockResolvedValueOnce({ ok: false, error: 'x', needsLogin: true });
  await render(
    <FollowButton
      username="bea"
      following={false}
      token="tok"
      onChange={jest.fn()}
      onExpired={onExpired}
    />,
  );
  await fireEvent.press(screen.getByLabelText('Seguir a @bea'));
  expect(await screen.findByText('Este perfil no está disponible.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Seguir a @bea'));
  await waitFor(() => expect(onExpired).toHaveBeenCalled());
});

test('test_PA_48_01_followingList_unfollowRemovesItFromTheList', async () => {
  const onChanged = jest.fn();
  jest
    .mocked(getFollowing)
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
  jest
    .mocked(unfollowUser)
    .mockResolvedValue({ ok: true, data: { following: false, followers: 0 } });
  await render(<FollowingList token="tok" onExpired={jest.fn()} onChanged={onChanged} />);

  expect(await screen.findByText('@bea')).toBeTruthy();
  expect(screen.getByText(/SIGUIENDO/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Dejar de seguir a @bea'));

  await waitFor(() => expect(screen.queryByText('@bea')).toBeNull());
  expect(onChanged).toHaveBeenCalled();
  expect(unfollowUser).toHaveBeenCalledWith('bea', 'tok');
});
