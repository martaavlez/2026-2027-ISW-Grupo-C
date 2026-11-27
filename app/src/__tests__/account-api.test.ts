// HU-45 · Llamadas a la API para editar el perfil, e imágenes servidas por la API.
import { removeMyPhoto, updateMyProfile, uploadMyPhoto } from '../services/api';
import { imageUri } from '../services/api-url';

const response = (status: number, body: unknown) =>
  ({ ok: status < 300, status, json: async () => body }) as Response;

test('test_updateMyProfile_patchesJsonWithToken', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { name: 'Lucía', bio: null }));

  await expect(updateMyProfile('tok', { name: 'Lucía', bio: '' }, fetchFn)).resolves.toEqual({
    ok: true,
    data: { name: 'Lucía', bio: null },
  });
  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('http://localhost:3000/me/profile');
  expect(options.method).toBe('PATCH');
  expect(options.headers).toEqual({
    'Content-Type': 'application/json',
    Authorization: 'Bearer tok',
  });
  expect(JSON.parse(options.body)).toEqual({ name: 'Lucía', bio: '' });
});

test('test_uploadMyPhoto_sendsTheImageAsIs', async () => {
  const fetchFn = jest.fn().mockResolvedValue(response(200, { photoUrl: '/users/x/photo?v=1' }));
  const photo = { type: 'image/webp' } as Blob;

  await uploadMyPhoto('tok', photo, fetchFn);

  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('http://localhost:3000/me/photo');
  expect(options).toMatchObject({ method: 'PUT', body: photo });
  expect(options.headers['Content-Type']).toBe('image/webp');
});

test('test_accountCalls_errors', async () => {
  const invalid = jest
    .fn()
    .mockResolvedValue(response(400, { error: 'x', errors: { name: 'Escribe tu nombre.' } }));
  const expired = jest.fn().mockResolvedValue(response(401, { error: 'Inicia sesión' }));
  const offline = jest.fn().mockRejectedValue(new TypeError('x'));

  await expect(updateMyProfile('tok', { name: '', bio: '' }, invalid)).resolves.toEqual({
    ok: false,
    errors: { name: 'Escribe tu nombre.' },
    needsLogin: false,
  });
  await expect(removeMyPhoto('tok', expired)).resolves.toMatchObject({
    needsLogin: true,
    errors: { form: 'Inicia sesión' },
  });
  await expect(removeMyPhoto('tok', offline)).resolves.toMatchObject({ ok: false });
});

test('test_imageUri_resolvesPhotosServedByTheApi', () => {
  expect(imageUri('/users/lucia/photo?v=1')).toBe('http://localhost:3000/users/lucia/photo?v=1');
  expect(imageUri('https://coverartarchive.org/a.jpg')).toBe('https://coverartarchive.org/a.jpg');
  expect(imageUri(null)).toBeNull();
});
