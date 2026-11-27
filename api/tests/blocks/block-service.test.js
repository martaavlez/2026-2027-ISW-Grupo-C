// Pruebas unitarias del servicio de bloqueos (HU-35 y HU-56), con los repositorios sustituidos.
const { createBlockService } = require('../../src/blocks/block-service');

function serviceWith({ user = { id: '2', username: 'bea' }, unblocked = true } = {}) {
  const blocks = {
    block: jest.fn().mockResolvedValue(undefined),
    unblock: jest.fn().mockResolvedValue(unblocked),
    findBlocked: jest
      .fn()
      .mockResolvedValue({ total: 1, items: [{ username: 'bea', photoUrl: 'data:x' }] }),
  };
  const profiles = { findByUsername: jest.fn().mockResolvedValue(user) };
  return { service: createBlockService({ blocks, profiles }), blocks, profiles };
}

test('test_PA_35_01_block_usesTheTokenUser', async () => {
  const { service, blocks } = serviceWith();
  await expect(service.block('1', 'bea')).resolves.toEqual({ blocked: true });
  expect(blocks.block).toHaveBeenCalledWith('1', '2');
});

test('test_PA_56_01_unblock_onlyWhatIBlocked', async () => {
  const { service, blocks } = serviceWith();
  await expect(service.unblock('1', 'bea')).resolves.toEqual({ blocked: false });
  expect(blocks.unblock).toHaveBeenCalledWith('1', '2');
  await expect(serviceWith({ unblocked: false }).service.unblock('1', 'bea')).rejects.toMatchObject(
    {
      status: 404,
      message: 'No tienes bloqueado a este usuario.',
    },
  );
});

test('test_block_needsLogin_notYourself_validUsername', async () => {
  await expect(serviceWith().service.block(null, 'bea')).rejects.toMatchObject({ status: 401 });
  const me = serviceWith({ user: { id: '1', username: 'ana' } });
  await expect(me.service.block('1', 'ana')).rejects.toMatchObject({ status: 404 });
  expect(me.blocks.block).not.toHaveBeenCalled();
  const { service, profiles } = serviceWith();
  await expect(service.block('1', "x'; DROP TABLE blocks; --")).rejects.toMatchObject({
    status: 404,
  });
  expect(profiles.findByUsername).not.toHaveBeenCalled();
  await expect(serviceWith({ user: null }).service.block('1', 'nadie')).rejects.toMatchObject({
    status: 404,
  });
});

test('test_listBlocked_pages_andMakesPhotosSafe', async () => {
  const { service } = serviceWith();
  const page = await service.listBlocked('1');
  expect(page).toMatchObject({ total: 1, offset: 0, pageSize: 24 });
  expect(page.items[0].photoUrl).toBeNull();
  await expect(service.listBlocked(null)).rejects.toMatchObject({ status: 401 });
});
