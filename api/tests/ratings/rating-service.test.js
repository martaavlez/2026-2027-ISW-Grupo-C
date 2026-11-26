const {
  createRatingService,
  LOGIN_REQUIRED,
  RATING_ERROR,
} = require('../../src/ratings/rating-service');
const { NotFoundError, ValidationError } = require('../../src/errors');
const { UnauthorizedError } = require('../../src/auth/auth-errors');

function serviceWith({ average = 4.5 } = {}) {
  const ratings = { saveRating: jest.fn().mockResolvedValue(average) };
  const catalog = {
    findRatingDistribution: jest.fn().mockResolvedValue({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }),
  };
  return { service: createRatingService({ ratings, catalog }), ratings, catalog };
}

test('test_PA_05_01_rate_savesAndReturnsNewSummary', async () => {
  const { service, ratings } = serviceWith();

  const result = await service.rate('song', '10', '7', { rating: 5 });

  expect(ratings.saveRating).toHaveBeenCalledWith({
    kind: 'song',
    itemId: '10',
    userId: '7',
    rating: 5,
  });
  expect(result).toEqual({
    myRating: 5,
    averageRating: 4.5,
    ratingsCount: 2,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
  });
});

test('test_PA_05_04_rate_asVisitor_asksToLogIn', async () => {
  const { service, ratings } = serviceWith();

  const error = await service.rate('album', '1', null, { rating: 4 }).catch((caught) => caught);

  expect(error).toBeInstanceOf(UnauthorizedError);
  expect(error.message).toBe(LOGIN_REQUIRED);
  expect(ratings.saveRating).not.toHaveBeenCalled();
});

test.each([0, 6, 3.5, -1, '4', null, undefined, NaN, Infinity, [4], { $gt: 0 }, true])(
  'test_PA_05_03_rate_withInvalidRating_%p_isRejected',
  async (rating) => {
    const { service, ratings } = serviceWith();

    const error = await service.rate('album', '1', '7', { rating }).catch((caught) => caught);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.errors).toEqual({ rating: RATING_ERROR });
    expect(ratings.saveRating).not.toHaveBeenCalled();
  },
);

test('test_rate_withInvalidId_isRejectedBeforeSaving', async () => {
  const { service, ratings } = serviceWith();
  await expect(service.rate('album', "1' OR 1=1", '7', { rating: 4 })).rejects.toBeInstanceOf(
    ValidationError,
  );
  expect(ratings.saveRating).not.toHaveBeenCalled();
});

test('test_rate_unknownItem_throwsNotFound', async () => {
  const { service, ratings } = serviceWith();
  ratings.saveRating.mockResolvedValue(undefined);
  await expect(service.rate('song', '999', '7', { rating: 3 })).rejects.toBeInstanceOf(
    NotFoundError,
  );
});

test('test_rate_lastRatingRemovedAverage_canBeNull', async () => {
  const { service } = serviceWith({ average: null });
  await expect(service.rate('song', '1', '7', { rating: 3 })).resolves.toMatchObject({
    averageRating: null,
  });
});
