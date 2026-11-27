const { UnauthorizedError } = require('../../src/auth/auth-errors');
const { ConflictError, NotFoundError, ValidationError } = require('../../src/errors');
const {
  createFriendService,
  ALREADY_FRIENDS,
  PENDING_FROM_THEM,
  NO_PENDING_REQUEST,
  REQUEST_NOT_FOUND,
  NOT_FRIENDS,
} = require('../../src/friends/friend-service');

function serviceWith({ user = { id: '9' }, blocked = false, state = 'none', ok = true } = {}) {
  const friends = {
    isBlocked: jest.fn().mockResolvedValue(blocked),
    findState: jest.fn().mockResolvedValue({ friendship: state, requestId: null }),
    send: jest.fn().mockResolvedValue(ok),
    cancel: jest.fn().mockResolvedValue(ok),
    respond: jest.fn().mockResolvedValue(ok),
    remove: jest.fn().mockResolvedValue(ok),
    findReceived: jest
      .fn()
      .mockResolvedValue([{ id: '1', username: 'nora', photoUrl: 'javascript:x' }]),
    findFriends: jest.fn().mockResolvedValue({ total: 1, items: [{ username: 'nora' }] }),
  };
  const profiles = { findByUsername: jest.fn().mockResolvedValue(user) };
  return { service: createFriendService({ friends, profiles }), friends, profiles };
}

test('test_PA_41_01_sendRequest_usesViewerFromToken', async () => {
  const { service, friends } = serviceWith({ state: 'sent' });

  const result = await service.sendRequest('7', 'nora.eco');

  expect(friends.send).toHaveBeenCalledWith('7', '9');
  expect(result.friendship).toBe('sent');
});

test('test_sendRequest_whenAlreadyFriendsOrPendingFromThem_conflicts', async () => {
  const friendsAlready = serviceWith({ ok: false, state: 'friends' }).service;
  const fromThem = serviceWith({ ok: false, state: 'received' }).service;

  await expect(friendsAlready.sendRequest('7', 'nora')).rejects.toThrow(ConflictError);
  await expect(friendsAlready.sendRequest('7', 'nora')).rejects.toMatchObject({
    errors: { friendship: ALREADY_FRIENDS },
  });
  await expect(fromThem.sendRequest('7', 'nora')).rejects.toMatchObject({
    errors: { friendship: PENDING_FROM_THEM },
  });
});

test('test_sendRequest_alreadySent_isNotDuplicated', async () => {
  const { service } = serviceWith({ ok: false, state: 'sent' });
  await expect(service.sendRequest('7', 'nora')).resolves.toMatchObject({ friendship: 'sent' });
});

test('test_RN_12_blockedSelfOrUnknown_areNotFound', async () => {
  for (const options of [{ blocked: true }, { user: { id: '7' } }, { user: null }]) {
    const { service, friends } = serviceWith(options);
    await expect(service.sendRequest('7', 'nora')).rejects.toBeInstanceOf(NotFoundError);
    expect(friends.send).not.toHaveBeenCalled();
  }
});

test('test_PA_41_02_cancelRequest', async () => {
  const { service, friends } = serviceWith();
  await expect(service.cancelRequest('7', 'nora')).resolves.toMatchObject({ friendship: 'none' });
  expect(friends.cancel).toHaveBeenCalledWith('7', '9');
  await expect(serviceWith({ ok: false }).service.cancelRequest('7', 'nora')).rejects.toThrow(
    new NotFoundError(NO_PENDING_REQUEST),
  );
});

test('test_PA_58_respond_acceptOrReject_onlyIfPendingForMe', async () => {
  const { service, friends } = serviceWith();
  await expect(service.respond('7', '3', true)).resolves.toEqual({
    friendship: 'friends',
    requestId: null,
  });
  await expect(service.respond('7', '3', false)).resolves.toMatchObject({ friendship: 'none' });
  expect(friends.respond).toHaveBeenCalledWith('7', '3', true);
  await expect(serviceWith({ ok: false }).service.respond('7', '3', true)).rejects.toThrow(
    new NotFoundError(REQUEST_NOT_FOUND),
  );
  await expect(service.respond('7', '1 OR 1=1', true)).rejects.toBeInstanceOf(ValidationError);
});

test('test_PA_42_removeFriend', async () => {
  const { service, friends } = serviceWith();
  await expect(service.removeFriend('7', 'nora')).resolves.toMatchObject({ friendship: 'none' });
  expect(friends.remove).toHaveBeenCalledWith('7', '9');
  await expect(serviceWith({ ok: false }).service.removeFriend('7', 'nora')).rejects.toThrow(
    new NotFoundError(NOT_FRIENDS),
  );
});

test('test_lists_haveSafePhotos', async () => {
  const { service } = serviceWith();
  expect((await service.listReceived('7')).items[0].photoUrl).toBeNull();
  expect(await service.listFriends('7')).toMatchObject({ total: 1, offset: 0, pageSize: 24 });
});

test('test_visitor_isRejectedEverywhere', async () => {
  const { service } = serviceWith();
  for (const call of [
    () => service.sendRequest(null, 'nora'),
    () => service.cancelRequest(null, 'nora'),
    () => service.respond(null, '1', true),
    () => service.removeFriend(null, 'nora'),
    () => service.listReceived(null),
    () => service.listFriends(null),
  ]) {
    await expect(call()).rejects.toBeInstanceOf(UnauthorizedError);
  }
});
