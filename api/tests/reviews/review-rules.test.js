const { parseReview, MESSAGES } = require('../../src/reviews/review-rules');
const { ValidationError } = require('../../src/errors');

const errorsOf = (input) => {
  try {
    parseReview(input);
    return null;
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationError);
    return error.errors;
  }
};

test('test_parseReview_valid_trimsAndNormalizesNewlines', () => {
  expect(
    parseReview({ rating: 4, body: '  Muy bueno\r\nde verdad  ', privacy: 'friends' }),
  ).toEqual({
    rating: 4,
    body: 'Muy bueno\nde verdad',
    privacy: 'friends',
  });
});

test('test_parseReview_withoutPrivacy_leavesItForTheDefault', () => {
  expect(parseReview({ rating: 3, body: 'Bien' }).privacy).toBeNull();
});

test('test_PA_23_04_withoutRating_asksToChooseOne', () => {
  expect(errorsOf({ body: 'Texto' })).toEqual({ rating: MESSAGES.ratingMissing });
  expect(errorsOf({ body: 'Texto', rating: null })).toEqual({ rating: MESSAGES.ratingMissing });
});

test.each([0, 6, 2.5, '4', [4]])('test_parseReview_invalidRating_%p', (rating) => {
  expect(errorsOf({ rating, body: 'Texto' })).toEqual({ rating: MESSAGES.ratingInvalid });
});

test.each([
  [undefined, MESSAGES.bodyMissing],
  ['   ', MESSAGES.bodyMissing],
  [{ $ne: '' }, MESSAGES.bodyMissing],
  ['x'.repeat(2001), MESSAGES.bodyTooLong],
  ['hola\u0000', MESSAGES.bodyInvalid],
])('test_parseReview_invalidBody_%#', (body, message) => {
  expect(errorsOf({ rating: 4, body })).toEqual({ body: message });
});

test('test_parseReview_exactly2000Characters_isAccepted', () => {
  expect(parseReview({ rating: 4, body: 'x'.repeat(2000) }).body).toHaveLength(2000);
});

test.each(['everyone', 'PUBLIC', '', null])('test_parseReview_invalidPrivacy_%p', (privacy) => {
  expect(errorsOf({ rating: 4, body: 'Texto', privacy })).toEqual({
    privacy: MESSAGES.privacyInvalid,
  });
});
