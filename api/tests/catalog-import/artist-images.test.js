const {
  createArtistImageFinder,
  htmlToText,
  isCommonsUpload,
  toCredit,
  wikidataIdFrom,
} = require('../../src/catalog-import/artist-images');

const THUMB = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Foto.jpg/500px-Foto.jpg';

function finderWith({ relations, fileName = 'Foto.jpg', info } = {}) {
  const musicBrainz = {
    getArtistUrlRelations: jest.fn().mockResolvedValue(
      relations ?? [
        { type: 'official homepage', url: { resource: 'https://grupo.test' } },
        { type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q44190' } },
      ],
    ),
  };
  const wikimedia = {
    getImageFileName: jest.fn().mockResolvedValue(fileName),
    getImageInfo: jest
      .fn()
      .mockResolvedValue(
        info === undefined
          ? { url: THUMB, author: '<a href="//x">Ana &amp; Luis</a>', license: 'CC BY-SA 4.0' }
          : info,
      ),
  };
  return { finder: createArtistImageFinder({ musicBrainz, wikimedia }), musicBrainz, wikimedia };
}

test('test_findImage_followsMusicBrainzWikidataAndCommons', async () => {
  const { finder, musicBrainz, wikimedia } = finderWith();

  await expect(finder.findImage('mbid-1')).resolves.toEqual({
    imageUrl: THUMB,
    credit: 'Ana & Luis · CC BY-SA 4.0 · Wikimedia Commons',
  });
  expect(musicBrainz.getArtistUrlRelations).toHaveBeenCalledWith('mbid-1');
  expect(wikimedia.getImageFileName).toHaveBeenCalledWith('Q44190');
  expect(wikimedia.getImageInfo).toHaveBeenCalledWith('Foto.jpg');
});

test('test_findImage_withoutWikidataLink_returnsNullWithoutAskingWikimedia', async () => {
  const { finder, wikimedia } = finderWith({ relations: [] });
  await expect(finder.findImage('mbid-1')).resolves.toBeNull();
  expect(wikimedia.getImageFileName).not.toHaveBeenCalled();
});

test('test_findImage_withoutPhotoInWikidata_returnsNull', async () => {
  const { finder } = finderWith({ fileName: null });
  await expect(finder.findImage('mbid-1')).resolves.toBeNull();
});

test.each([
  ['sin información', null],
  ['fuera de Wikimedia', { url: 'https://otra-web.test/foto.jpg', author: 'x', license: 'y' }],
  ['no https', { url: 'http://upload.wikimedia.org/foto.jpg', author: 'x', license: 'y' }],
])('test_findImage_%s_returnsNull', async (_case, info) => {
  const { finder } = finderWith({ info });
  await expect(finder.findImage('mbid-1')).resolves.toBeNull();
});

test('test_wikidataIdFrom_onlyAcceptsRealWikidataUrls', () => {
  expect(
    wikidataIdFrom([{ type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q1' } }]),
  ).toBe('Q1');
  expect(
    wikidataIdFrom([
      { type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q1/../../evil' } },
      { type: 'wikidata', url: { resource: 'https://evil.test/wiki/Q2' } },
      { type: 'other', url: { resource: 'https://www.wikidata.org/wiki/Q3' } },
    ]),
  ).toBeNull();
});

test('test_htmlToText_removesTagsAndScripts', () => {
  expect(htmlToText('<span><script>alert(1)</script>Foto de <b>Ana</b>&nbsp;&lt;3</span>')).toBe(
    'alert(1) Foto de Ana <3',
  );
});

test('test_toCredit_isPlainTextAndLimitedTo300', () => {
  expect(toCredit(null, 'CC0')).toBe('CC0 · Wikimedia Commons');
  expect(toCredit('x'.repeat(400), 'CC BY')).toHaveLength(300);
});

test('test_isCommonsUpload', () => {
  expect(isCommonsUpload(THUMB)).toBe(true);
  expect(isCommonsUpload('https://upload.wikimedia.org.evil.test/x.jpg')).toBe(false);
  expect(isCommonsUpload('javascript:alert(1)')).toBe(false);
  expect(isCommonsUpload(null)).toBe(false);
});
