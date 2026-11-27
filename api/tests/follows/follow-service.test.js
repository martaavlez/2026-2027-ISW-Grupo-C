// Pruebas unitarias del servicio de seguir (HU-10 y HU-48), con los repositorios sustituidos.
const { createFollowService } = require('../../src/follows/follow-service');

function serviceWith({ user = { id: '2', username: 'bea' }, blocked = false } = {}) {
  const follows = {
    follow: jest.fn().mockResolvedValue(undefined),
    unfollow: jest.fn().mockResolvedValue(undefined),
    countFollowers: jest.fn().mockResolvedValue(3),
    findFollowing: jest
      .fn()
      .mockResolvedValue({ total: 1, items: [{ username: 'bea', photoUrl: 'javascript:x' }] }),
  };
  const profiles = {
    findByUsername: jest.fn().mockResolvedValue(user),
    findRelationship: jest.fn().mockResolvedValue({ friends: false, following: false, blocked }),
  };
  return { service: createFollowService({ follows, profiles }), follows, profiles };
}

test('test_PA_10_01_follow_usesTheTokenUser_andReturnsFollowers', async () => {
  const { service, follows } = serviceWith();
  await expect(service.follow('1', 'bea')).resolves.toEqual({ following: true, followers: 3 });
  expect(follows.follow).toHaveBeenCalledWith('1', '2');
});

test('test_PA_48_01_unfollow', async () => {
  const { service, follows } = serviceWith();
  await expect(service.unfollow('1', 'bea')).resolves.toEqual({ following: false, followers: 3 });
  expect(follows.unfollow).toHaveBeenCalledWith('1', '2');
});

test('test_follow_needsLogin_andCannotFollowYourself', async () => {
  const { service, follows } = serviceWith({ user: { id: '1', username: 'ana' } });
  await expect(service.follow(null, 'ana')).rejects.toMatchObject({ status: 401 });
  await expect(service.follow('1', 'ana')).rejects.toMatchObject({ status: 404 });
  expect(follows.follow).not.toHaveBeenCalled();
});

test('test_RN_12_blocked_orMissing_orBadUsername_isNotFound', async () => {
  await expect(serviceWith({ blocked: true }).service.follow('1', 'bea')).rejects.toMatchObject({
    status: 404,
    message: 'Este perfil no está disponible.',
  });
  await expect(serviceWith({ user: null }).service.follow('1', 'nadie')).rejects.toMatchObject({
    status: 404,
  });
  const { service, profiles } = serviceWith();
  await expect(service.follow('1', "bea' OR 1=1")).rejects.toMatchObject({ status: 404 });
  expect(profiles.findByUsername).not.toHaveBeenCalled();
});

test('test_listFollowing_pagesAndMakesPhotosSafe', async () => {
  const { service, follows } = serviceWith();
  const page = await service.listFollowing('1', '24');
  expect(page).toMatchObject({ total: 1, offset: 24, pageSize: 24 });
  expect(page.items[0].photoUrl).toBeNull();
  expect(follows.findFollowing).toHaveBeenCalledWith('1', { limit: 24, offset: 24 });
  await expect(service.listFollowing(null)).rejects.toMatchObject({ status: 401 });
});
