const {
  createMusicBrainzClient,
  buildReleaseGroupQuery,
  MusicBrainzUnavailableError,
} = require('../../src/catalog-import/musicbrainz-client');

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function clientWith(fetchFn, clock = { time: 0 }) {
  const sleep = jest.fn(async (ms) => {
    clock.time += ms;
  });
  const client = createMusicBrainzClient({
    baseUrl: 'https://mb.test/ws/2',
    userAgent: 'Repeat/test ( contacto )',
    fetchFn,
    sleep,
    now: () => clock.time,
  });
  return { client, sleep };
}

test('test_buildReleaseGroupQuery_withDate_addsReleaseDateRange', () => {
  expect(buildReleaseGroupQuery('hip hop', '2026-11-23')).toBe(
    'tag:"hip hop" AND primarytype:(album OR ep OR single) AND firstreleasedate:[2026-11-23 TO *]',
  );
  expect(buildReleaseGroupQuery('ro"ck', null)).toBe(
    'tag:"rock" AND primarytype:(album OR ep OR single)',
  );
});

test('test_searchReleaseGroups_whenCalled_sendsUserAgentAndQuery', async () => {
  const fetchFn = jest.fn().mockResolvedValue(jsonResponse({ count: 1, 'release-groups': [{}] }));
  const { client } = clientWith(fetchFn);

  const page = await client.searchReleaseGroups({ tag: 'rock', limit: 250, offset: 100 });

  const [url, options] = fetchFn.mock.calls[0];
  expect(options.headers['User-Agent']).toBe('Repeat/test ( contacto )');
  expect(url.pathname).toBe('/ws/2/release-group');
  expect(url.searchParams.get('limit')).toBe('100');
  expect(url.searchParams.get('offset')).toBe('100');
  expect(url.searchParams.get('fmt')).toBe('json');
  expect(page).toEqual({ total: 1, releaseGroups: [{}] });
});

test('test_searchReleaseGroups_withEmptyBody_returnsNoResults', async () => {
  const { client } = clientWith(jest.fn().mockResolvedValue(jsonResponse({})));

  await expect(client.searchReleaseGroups({ tag: 'rock', limit: 10 })).resolves.toEqual({
    total: 0,
    releaseGroups: [],
  });
});

test('test_requests_whenMadeInARow_waitAtLeastOneSecondBetweenThem', async () => {
  const fetchFn = jest.fn().mockResolvedValue(jsonResponse({ id: 'r' }));
  const { client, sleep } = clientWith(fetchFn);

  await client.getRelease('a');
  await client.getRelease('b');

  expect(sleep).toHaveBeenCalledTimes(1);
  expect(sleep.mock.calls[0][0]).toBeGreaterThanOrEqual(1000);
});

test('test_getRelease_whenServerIsBusy_retriesAndReturnsData', async () => {
  const fetchFn = jest
    .fn()
    .mockResolvedValueOnce(jsonResponse({}, 503))
    .mockRejectedValueOnce(new Error('socket hang up'))
    .mockResolvedValueOnce(jsonResponse({ id: 'release' }));
  const { client } = clientWith(fetchFn);

  await expect(client.getRelease('release')).resolves.toEqual({ id: 'release' });
  expect(fetchFn).toHaveBeenCalledTimes(3);
  expect(fetchFn.mock.calls[0][0].searchParams.get('inc')).toBe('recordings+artist-credits');
});

test('test_getRelease_whenNotFound_returnsNull', async () => {
  const { client } = clientWith(jest.fn().mockResolvedValue(jsonResponse({}, 404)));

  await expect(client.getRelease('missing')).resolves.toBeNull();
});

test('test_search_whenMusicBrainzIsDown_throwsUnavailableAfterThreeAttempts', async () => {
  const fetchFn = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
  const { client } = clientWith(fetchFn);

  await expect(client.searchReleaseGroups({ tag: 'rock', limit: 1 })).rejects.toThrow(
    MusicBrainzUnavailableError,
  );
  expect(fetchFn).toHaveBeenCalledTimes(3);
});

test('test_search_whenRequestIsRejected_doesNotRetry', async () => {
  const fetchFn = jest.fn().mockResolvedValue(jsonResponse({}, 400));
  const { client } = clientWith(fetchFn);

  await expect(client.searchReleaseGroups({ tag: 'rock', limit: 1 })).rejects.toThrow(
    'MusicBrainz no está disponible (respondió 400)',
  );
  expect(fetchFn).toHaveBeenCalledTimes(1);
});

test('test_createClient_inTestsWithoutMock_refusesRealMusicBrainz', () => {
  expect(() => createMusicBrainzClient({ baseUrl: 'x', userAgent: 'y' })).toThrow(
    'versión simulada de MusicBrainz',
  );
});

test('test_getArtistUrlRelations_requestsUrlRelsAndReturnsThem', async () => {
  const relations = [{ type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q1' } }];
  const fetchFn = jest
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => ({ relations }) });
  const { client } = clientWith(fetchFn);

  await expect(client.getArtistUrlRelations('mbid-1')).resolves.toEqual(relations);
  const url = new URL(fetchFn.mock.calls[0][0]);
  expect(url.pathname).toBe('/ws/2/artist/mbid-1');
  expect(url.searchParams.get('inc')).toBe('url-rels');
});

test('test_getArtistUrlRelations_unknownArtist_returnsEmpty', async () => {
  const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
  const { client } = clientWith(fetchFn);
  await expect(client.getArtistUrlRelations('nope')).resolves.toEqual([]);
});

test('test_searchArtists_quotesTheNameAndMapsResults', async () => {
  const fetchFn = jest.fn().mockResolvedValue(
    jsonResponse({
      artists: [
        {
          id: 'mbid-robe',
          name: 'Robe',
          disambiguation: 'Spanish singer',
          country: 'ES',
          score: 100,
        },
      ],
    }),
  );
  const { client } = clientWith(fetchFn);

  await expect(client.searchArtists('Ro"be')).resolves.toEqual([
    { id: 'mbid-robe', name: 'Robe', disambiguation: 'Spanish singer', country: 'ES', score: 100 },
  ]);
  const url = new URL(fetchFn.mock.calls[0][0]);
  expect(url.pathname).toBe('/ws/2/artist');
  expect(url.searchParams.get('query')).toBe('artist:"Robe"');
});

test('test_searchReleaseGroupsByArtist_filtersByArtistAndType', async () => {
  const fetchFn = jest
    .fn()
    .mockResolvedValue(jsonResponse({ count: 1, 'release-groups': [{ id: 'rg' }] }));
  const { client } = clientWith(fetchFn);

  await expect(
    client.searchReleaseGroupsByArtist({ artistId: 'mbid-robe', limit: 500, offset: 100 }),
  ).resolves.toEqual({ total: 1, releaseGroups: [{ id: 'rg' }] });
  const url = new URL(fetchFn.mock.calls[0][0]);
  expect(url.searchParams.get('query')).toBe(
    'arid:mbid-robe AND primarytype:(album OR ep OR single)',
  );
  expect(url.searchParams.get('limit')).toBe('100');
  expect(url.searchParams.get('offset')).toBe('100');
});
