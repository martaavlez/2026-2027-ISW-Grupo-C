import { getApiStatus } from '../services/api';

const fakeResponse = (ok: boolean) => ({ ok }) as Response;

test('test_getApiStatus_whenApiResponds_returnsOk', async () => {
  const fetchFn = jest.fn().mockResolvedValue(fakeResponse(true));
  await expect(getApiStatus(fetchFn)).resolves.toBe('ok');
});

test('test_getApiStatus_whenApiReturnsError_returnsError', async () => {
  const fetchFn = jest.fn().mockResolvedValue(fakeResponse(false));
  await expect(getApiStatus(fetchFn)).resolves.toBe('error');
});

test('test_getApiStatus_whenNetworkFails_returnsError', async () => {
  const fetchFn = jest.fn().mockRejectedValue(new Error('network'));
  await expect(getApiStatus(fetchFn)).resolves.toBe('error');
});
