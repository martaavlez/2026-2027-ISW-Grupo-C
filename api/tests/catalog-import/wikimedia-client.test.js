const {
  createWikimediaClient,
  WikimediaUnavailableError,
} = require('../../src/catalog-import/wikimedia-client');

const response = (status, body) => ({ ok: status < 300, status, json: async () => body });

function clientWith(...responses) {
  const fetchFn = jest.fn();
  for (const item of responses) {
    if (item instanceof Error) fetchFn.mockRejectedValueOnce(item);
    else fetchFn.mockResolvedValueOnce(item);
  }
  const clock = { time: 0 };
  const sleep = jest.fn(async (ms) => {
    clock.time += ms;
  });
  const client = createWikimediaClient({
    userAgent: 'Hertz/test ( contacto )',
    fetchFn,
    sleep,
    now: () => clock.time,
  });
  return { client, fetchFn, sleep };
}

test('test_getImageFileName_readsP18AndSendsUserAgent', async () => {
  const { client, fetchFn } = clientWith(
    response(200, {
      entities: {
        Q44190: { claims: { P18: [{ mainsnak: { datavalue: { value: 'Foto banda.jpg' } } }] } },
      },
    }),
  );

  await expect(client.getImageFileName('Q44190')).resolves.toBe('Foto banda.jpg');
  const [url, options] = fetchFn.mock.calls[0];
  expect(url).toBe('https://www.wikidata.org/wiki/Special:EntityData/Q44190.json');
  expect(options.headers['User-Agent']).toBe('Hertz/test ( contacto )');
});

test('test_getImageFileName_withoutPhotoOrNotFound_returnsNull', async () => {
  const { client } = clientWith(
    response(200, { entities: { Q1: { claims: {} } } }),
    response(404, {}),
  );
  await expect(client.getImageFileName('Q1')).resolves.toBeNull();
  await expect(client.getImageFileName('Q2')).resolves.toBeNull();
});

test('test_getImageInfo_returnsThumbnailAuthorAndLicense', async () => {
  const { client, fetchFn } = clientWith(
    response(200, {
      query: {
        pages: {
          123: {
            imageinfo: [
              {
                thumburl: 'https://upload.wikimedia.org/thumb.jpg',
                url: 'https://upload.wikimedia.org/full.jpg',
                extmetadata: {
                  Artist: { value: '<a>Ana</a>' },
                  LicenseShortName: { value: 'CC BY 4.0' },
                },
              },
            ],
          },
        },
      },
    }),
  );

  await expect(client.getImageInfo('Foto banda.jpg')).resolves.toEqual({
    url: 'https://upload.wikimedia.org/thumb.jpg',
    author: '<a>Ana</a>',
    license: 'CC BY 4.0',
  });
  const url = new URL(fetchFn.mock.calls[0][0]);
  expect(url.origin + url.pathname).toBe('https://commons.wikimedia.org/w/api.php');
  expect(url.searchParams.get('titles')).toBe('File:Foto banda.jpg');
  expect(url.searchParams.get('iiurlwidth')).toBe('500');
});

test('test_getImageInfo_missingFile_returnsNull', async () => {
  const { client } = clientWith(response(200, { query: { pages: { '-1': { missing: '' } } } }));
  await expect(client.getImageInfo('No existe.jpg')).resolves.toBeNull();
});

test('test_wikimediaDown_throwsUnavailable', async () => {
  const { client } = clientWith(response(503, {}), new Error('ECONNRESET'));
  await expect(client.getImageFileName('Q1')).rejects.toBeInstanceOf(WikimediaUnavailableError);
  await expect(client.getImageFileName('Q1')).rejects.toBeInstanceOf(WikimediaUnavailableError);
});

test('test_requests_waitOneSecondBetweenEachOther', async () => {
  const { client, sleep } = clientWith(response(404, {}), response(404, {}));
  await client.getImageFileName('Q1');
  await client.getImageFileName('Q2');
  expect(sleep).toHaveBeenCalledWith(1000);
});

test('test_inTests_realWikimediaIsNeverCalled', () => {
  expect(() => createWikimediaClient({ userAgent: 'x' })).toThrow('versión simulada de Wikimedia');
});
