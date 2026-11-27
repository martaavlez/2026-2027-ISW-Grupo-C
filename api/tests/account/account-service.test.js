const { UnauthorizedError } = require('../../src/auth/auth-errors');
const { NotFoundError, ValidationError } = require('../../src/errors');
const {
  createAccountService,
  parseProfile,
  detectImageType,
  MESSAGES,
} = require('../../src/account/account-service');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 1]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);

function serviceWith(overrides = {}) {
  const accounts = {
    updateProfile: jest.fn().mockResolvedValue({ name: 'Lucía', bio: null }),
    savePhoto: jest.fn().mockResolvedValue('/users/lucia/photo?v=1'),
    removePhoto: jest.fn().mockResolvedValue(true),
    findPhoto: jest.fn().mockResolvedValue({ data: PNG, type: 'image/png' }),
    ...overrides,
  };
  return { service: createAccountService({ accounts }), accounts };
}

test('test_parseProfile_trimsAndEmptyBioIsNull', () => {
  expect(parseProfile({ name: '  Lucía ', bio: '   ' })).toEqual({ name: 'Lucía', bio: null });
  expect(parseProfile({ name: 'Lucía', bio: 'Línea 1\nLínea 2' }).bio).toBe('Línea 1\nLínea 2');
});

test.each([
  [{ name: '' }, 'name', MESSAGES.nameRequired],
  [{ name: 'x'.repeat(51) }, 'name', MESSAGES.nameTooLong],
  [{ name: 'Lu\u0000cía' }, 'name', MESSAGES.nameInvalid],
  [{ name: 'Lucía', bio: 'x'.repeat(301) }, 'bio', MESSAGES.bioTooLong],
  [{ name: 'Lucía', bio: 'hola\u0007' }, 'bio', MESSAGES.bioInvalid],
  [{ name: 'Lucía', bio: ['no'] }, 'bio', MESSAGES.bioInvalid],
  [{ name: ['Lucía'] }, 'name', MESSAGES.nameRequired],
])('test_security_parseProfile_rejects %j', (body, field, message) => {
  const error = (() => {
    try {
      parseProfile(body);
    } catch (e) {
      return e;
    }
  })();
  expect(error).toBeInstanceOf(ValidationError);
  expect(error.errors[field]).toBe(message);
});

test('test_parseProfile_countsCharactersNotBytes', () => {
  expect(parseProfile({ name: 'ñ'.repeat(50) }).name).toHaveLength(50);
});

test('test_detectImageType_byFirstBytes', () => {
  expect(detectImageType(PNG)).toBe('image/png');
  expect(detectImageType(JPEG)).toBe('image/jpeg');
  expect(detectImageType(WEBP)).toBe('image/webp');
  expect(detectImageType(Buffer.from('<svg onload=alert(1)>..'))).toBeNull();
  expect(detectImageType(Buffer.from('GIF89a......'))).toBeNull();
  expect(detectImageType({})).toBeNull();
});

test('test_PA_45_01_updateProfile_usesViewerFromToken', async () => {
  const { service, accounts } = serviceWith();
  await service.updateProfile('7', { name: 'Lucía', bio: 'Hola', id: '1' });
  expect(accounts.updateProfile).toHaveBeenCalledWith('7', { name: 'Lucía', bio: 'Hola' });
});

test('test_PA_45_01_updatePhoto_savesWithDetectedType', async () => {
  const { service, accounts } = serviceWith();

  await expect(service.updatePhoto('7', PNG)).resolves.toEqual({
    photoUrl: '/users/lucia/photo?v=1',
  });
  expect(accounts.savePhoto).toHaveBeenCalledWith('7', { data: PNG, type: 'image/png' });
});

test('test_security_updatePhoto_rejectsOtherFilesOrTooBig', async () => {
  const { service, accounts } = serviceWith();
  await expect(service.updatePhoto('7', Buffer.from('not an image!'))).rejects.toThrow(
    ValidationError,
  );
  await expect(service.updatePhoto('7', {})).rejects.toThrow(ValidationError);
  const big = Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]);
  await expect(service.updatePhoto('7', big)).rejects.toMatchObject({
    errors: { photo: MESSAGES.photoTooBig },
  });
  expect(accounts.savePhoto).not.toHaveBeenCalled();
});

test('test_visitorOrInactiveAccount_isRejected', async () => {
  const { service } = serviceWith();
  await expect(service.updateProfile(null, { name: 'x' })).rejects.toThrow(UnauthorizedError);
  await expect(service.updatePhoto(null, PNG)).rejects.toThrow(UnauthorizedError);
  await expect(service.removePhoto(null)).rejects.toThrow(UnauthorizedError);
  const inactive = serviceWith({
    updateProfile: jest.fn().mockResolvedValue(null),
    removePhoto: jest.fn().mockResolvedValue(false),
  }).service;
  await expect(inactive.updateProfile('7', { name: 'x' })).rejects.toThrow(UnauthorizedError);
  await expect(inactive.removePhoto('7')).rejects.toThrow(UnauthorizedError);
});

test('test_getPhoto_badUsernameOrNoPhoto_isNotFound', async () => {
  const { service, accounts } = serviceWith({ findPhoto: jest.fn().mockResolvedValue(null) });
  await expect(service.getPhoto('../etc')).rejects.toThrow(NotFoundError);
  expect(accounts.findPhoto).not.toHaveBeenCalled();
  await expect(service.getPhoto('lucia')).rejects.toThrow(NotFoundError);
});
