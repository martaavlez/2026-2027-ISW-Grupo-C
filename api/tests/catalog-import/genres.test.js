const { parseGenres, DEFAULT_GENRES } = require('../../src/catalog-import/genres');

test('test_parseGenres_withTagAndName_returnsBoth', () => {
  expect(parseGenres('electronic=Electrónica, Hip Hop=Hip hop')).toEqual([
    { tag: 'electronic', name: 'Electrónica' },
    { tag: 'hip hop', name: 'Hip hop' },
  ]);
});

test('test_parseGenres_withoutName_usesTagAsName', () => {
  expect(parseGenres('rock,,  jazz ')).toEqual([
    { tag: 'rock', name: 'rock' },
    { tag: 'jazz', name: 'jazz' },
  ]);
});

test('test_parseGenres_withoutText_returnsTenDefaultGenres', () => {
  expect(parseGenres()).toHaveLength(10);
  expect(parseGenres(DEFAULT_GENRES)[0]).toEqual({ tag: 'pop', name: 'Pop' });
});
