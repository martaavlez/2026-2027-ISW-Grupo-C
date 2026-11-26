const { escapeLike, fold, parseSearchTerm } = require('../../src/search/search-term');
const { ValidationError } = require('../../src/errors');

test('test_fold_removesAccentsAndUppercase', () => {
  expect(fold('Luz de NEÓN Ñandú')).toBe('luz de neon nandu');
});

test('test_escapeLike_escapesWildcards', () => {
  expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b');
});

test('test_parseSearchTerm_trimsCollapsesSpacesAndBuildsPatterns', () => {
  expect(parseSearchTerm('  Luz   de Neón ')).toEqual({
    term: 'Luz de Neón',
    exact: 'luz de neon',
    prefix: 'luz de neon%',
    contains: '%luz de neon%',
  });
});

test('test_parseSearchTerm_withPercent_searchesItLiterally', () => {
  expect(parseSearchTerm('%%').contains).toBe('%\\%\\%%');
});

test.each([undefined, ['a', 'b'], '', ' a ', 'x'.repeat(101), 'hola\u0000', 'bell\u0007x'])(
  'test_parseSearchTerm_invalid_%p_throwsValidation',
  (raw) => {
    expect(() => parseSearchTerm(raw)).toThrow(ValidationError);
  },
);

test('test_parseSearchTerm_tabsAndNewlines_becomeSpaces', () => {
  expect(parseSearchTerm('luz\tde\nneón').term).toBe('luz de neón');
});
