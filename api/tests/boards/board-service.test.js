// Pruebas unitarias de las reglas y del servicio de tableros (HU-09, HU-25, HU-49, HU-26,
// HU-50 y HU-34), con el repositorio sustituido.
const { parseBoardChanges, parseNewBoard, parseNewItem } = require('../../src/boards/board-rules');
const { createBoardService } = require('../../src/boards/board-service');

const BOARD = {
  id: '5',
  name: 'Carretera',
  description: null,
  privacy: 'friends',
  ownerId: '1',
  coverItemId: null,
  coverUrl: 'javascript:alert(1)',
  createdAt: '2026-11-01',
  username: 'lucia',
  ownerName: 'Lucía',
  ownerPhotoUrl: null,
  itemsCount: 0,
  followersCount: 0,
};

function serviceWith(overrides = {}, relation = { friends: false, blocked: false }) {
  const boards = {
    create: jest.fn().mockResolvedValue('9'),
    findBoard: jest.fn().mockResolvedValue(BOARD),
    findItems: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue('updated'),
    remove: jest.fn().mockResolvedValue(true),
    addItem: jest.fn().mockResolvedValue({ id: '3' }),
    removeItem: jest.fn().mockResolvedValue(true),
    findMineFor: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  const profiles = { findRelationship: jest.fn().mockResolvedValue(relation) };
  return { service: createBoardService({ boards, profiles }), boards, profiles };
}

describe('reglas de un tablero', () => {
  test('test_PA_09_03_withoutName_isRejected', () => {
    expect(() => parseNewBoard({ name: '   ' })).toThrow(
      expect.objectContaining({ errors: { name: 'Ponle un nombre al tablero.' } }),
    );
    expect(() => parseNewBoard({})).toThrow(expect.objectContaining({ status: 400 }));
  });

  test('test_PA_09_02_withoutPrivacy_leavesItToTheUserDefault', () => {
    expect(parseNewBoard({ name: ' Noche ', description: '  ' })).toEqual({
      name: 'Noche',
      description: null,
      privacy: null,
    });
  });

  test('test_rules_rejectLongTexts_controlCharacters_andUnknownPrivacy', () => {
    const bad = (body) => {
      try {
        parseNewBoard(body);
      } catch (error) {
        return error.errors;
      }
      return null;
    };
    expect(bad({ name: 'x'.repeat(81) })).toHaveProperty('name');
    expect(bad({ name: 'a\u0000b' })).toHaveProperty('name');
    expect(bad({ name: 'Noche', description: 'x'.repeat(501) })).toHaveProperty('description');
    expect(bad({ name: 'Noche', description: 42 })).toHaveProperty('description');
    expect(bad({ name: 'Noche', privacy: 'everyone' })).toHaveProperty('privacy');
    // Los saltos de línea sí valen en la descripción.
    expect(parseNewBoard({ name: 'Noche', description: 'a\nb' }).description).toBe('a\nb');
    // 80 emojis son 80 caracteres, aunque ocupen más.
    expect(parseNewBoard({ name: '🎵'.repeat(80) }).name).toHaveLength(160);
  });

  test('test_changes_onlyWhatIsSent_andSomethingMustChange', () => {
    expect(parseBoardChanges({ privacy: 'private' })).toEqual({ privacy: 'private' });
    expect(parseBoardChanges({ coverItemId: null })).toEqual({ coverItemId: null });
    expect(() => parseBoardChanges({})).toThrow(expect.objectContaining({ status: 400 }));
    expect(() => parseBoardChanges({ coverItemId: 7 })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
    expect(() => parseBoardChanges({ coverItemId: '1 OR 1=1' })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  test('test_newItem_onlySongsOrAlbums_withAValidId', () => {
    expect(parseNewItem({ kind: 'song', id: '4' })).toEqual({ kind: 'song', itemId: '4' });
    for (const body of [
      { kind: 'artist', id: '4' },
      { kind: 'song', id: '0' },
      { kind: 'album', id: 4 },
      {},
    ]) {
      expect(() => parseNewItem(body)).toThrow(expect.objectContaining({ status: 400 }));
    }
  });
});

describe('servicio de tableros', () => {
  test('test_create_needsALogin_andUsesTheTokenUser', async () => {
    const { service, boards } = serviceWith();
    await expect(service.create(null, { name: 'Noche' })).rejects.toMatchObject({ status: 401 });
    await expect(service.create('1', { name: 'Noche', ownerId: '2' })).resolves.toEqual({
      id: '9',
    });
    expect(boards.create).toHaveBeenCalledWith('1', {
      name: 'Noche',
      description: null,
      privacy: null,
    });
  });

  test('test_PA_34_02_friendsOnly_isHiddenFromNonFriends_andShownToFriends', async () => {
    await expect(serviceWith().service.get('2', '5')).rejects.toMatchObject({ status: 404 });
    await expect(serviceWith().service.get(null, '5')).rejects.toMatchObject({ status: 404 });
    const friend = await serviceWith({}, { friends: true, blocked: false }).service.get('2', '5');
    expect(friend).toMatchObject({ isOwner: false, name: 'Carretera' });
    // Solo el dueño ve el nivel de privacidad y la portada elegida.
    expect(friend.privacy).toBeUndefined();
    expect(friend.coverItemId).toBeUndefined();
  });

  test('test_get_blockedOrPrivate_isNotShown_andCoverIsSafe', async () => {
    const blocked = serviceWith(
      { findBoard: jest.fn().mockResolvedValue({ ...BOARD, privacy: 'public' }) },
      {
        friends: true,
        blocked: true,
      },
    );
    await expect(blocked.service.get('2', '5')).rejects.toMatchObject({ status: 404 });
    const priv = serviceWith(
      { findBoard: jest.fn().mockResolvedValue({ ...BOARD, privacy: 'private' }) },
      {
        friends: true,
        blocked: false,
      },
    );
    await expect(priv.service.get('2', '5')).rejects.toMatchObject({ status: 404 });
    const own = await serviceWith().service.get('1', '5');
    expect(own).toMatchObject({ isOwner: true, privacy: 'friends', coverUrl: null });
  });

  test('test_get_invalidId_isNotFound_withoutQuerying', async () => {
    const { service, boards } = serviceWith();
    await expect(service.get('1', '5; DROP TABLE boards')).rejects.toMatchObject({ status: 404 });
    expect(boards.findBoard).not.toHaveBeenCalled();
  });

  test('test_RN_13_othersCannotChange_sameAnswerAsMissing', async () => {
    const notMine = {
      update: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(false),
    };
    const { service } = serviceWith({
      ...notMine,
      addItem: jest.fn().mockResolvedValue(null),
      removeItem: jest.fn().mockResolvedValue(null),
    });
    await expect(service.update('2', '5', { name: 'Mío' })).rejects.toMatchObject({ status: 404 });
    await expect(service.remove('2', '5')).rejects.toMatchObject({ status: 404 });
    await expect(service.addItem('2', '5', { kind: 'song', id: '1' })).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.removeItem('2', '5', '3')).rejects.toMatchObject({ status: 404 });
    await expect(service.update(null, '5', { name: 'Mío' })).rejects.toMatchObject({ status: 401 });
  });

  test('test_PA_25_02_duplicate_isAConflict_andMissingItemIsNotFound', async () => {
    const dup = serviceWith({ addItem: jest.fn().mockResolvedValue('duplicate') });
    await expect(dup.service.addItem('1', '5', { kind: 'song', id: '1' })).rejects.toMatchObject({
      status: 409,
      errors: { item: 'Ya está en este tablero.' },
    });
    const missing = serviceWith({ addItem: jest.fn().mockResolvedValue('missing') });
    await expect(
      missing.service.addItem('1', '5', { kind: 'album', id: '1' }),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  test('test_PA_26_03_coverFromAnotherBoard_isRejected', async () => {
    const { service } = serviceWith({ update: jest.fn().mockResolvedValue('badCover') });
    await expect(service.update('1', '5', { coverItemId: '99' })).rejects.toMatchObject({
      status: 400,
    });
  });
});
