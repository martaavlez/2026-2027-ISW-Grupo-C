const {
  createReviewService,
  LOGIN_REQUIRED,
  ALREADY_PUBLISHED,
} = require('../../src/reviews/review-service');
const { UnauthorizedError } = require('../../src/auth/auth-errors');
const { ConflictError, NotFoundError, ValidationError } = require('../../src/errors');

const published = {
  review: {
    id: '9',
    rating: 5,
    body: 'Discazo',
    privacy: 'friends',
    createdAt: '2026-11-26T10:00:00Z',
    updatedAt: null,
    username: 'ana',
    name: 'Ana',
    photoUrl: 'javascript:x',
  },
  averageRating: 4.5,
};

function serviceWith(result = published) {
  const reviews = { publish: jest.fn().mockResolvedValue(result) };
  const catalog = {
    findRatingDistribution: jest.fn().mockResolvedValue({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }),
  };
  return { service: createReviewService({ reviews, catalog }), reviews };
}

test('test_PA_23_01_publish_returnsReviewSummaryAndListItem', async () => {
  const { service, reviews } = serviceWith();

  const result = await service.publish('album', '1', '7', {
    rating: 5,
    body: ' Discazo ',
    privacy: 'friends',
  });

  expect(reviews.publish).toHaveBeenCalledWith({
    kind: 'album',
    itemId: '1',
    userId: '7',
    rating: 5,
    body: 'Discazo',
    privacy: 'friends',
  });
  expect(result).toMatchObject({
    myRating: 5,
    myReview: { body: 'Discazo', privacy: 'friends' },
    averageRating: 4.5,
    ratingsCount: 2,
    review: { id: '9', username: 'ana', photoUrl: null },
  });
  expect(result.review.privacy).toBeUndefined();
});

test('test_publish_asVisitor_asksToLogIn', async () => {
  const { service, reviews } = serviceWith();
  await expect(service.publish('song', '1', null, { rating: 4, body: 'x' })).rejects.toThrow(
    new UnauthorizedError(LOGIN_REQUIRED),
  );
  expect(reviews.publish).not.toHaveBeenCalled();
});

test('test_publish_invalid_isRejectedBeforeSaving', async () => {
  const { service, reviews } = serviceWith();
  await expect(service.publish('song', '1', '7', { body: 'x' })).rejects.toBeInstanceOf(
    ValidationError,
  );
  await expect(
    service.publish('song', 'abc', '7', { rating: 4, body: 'x' }),
  ).rejects.toBeInstanceOf(ValidationError);
  expect(reviews.publish).not.toHaveBeenCalled();
});

test('test_publish_unknownItem_throwsNotFound', async () => {
  const { service } = serviceWith(null);
  await expect(service.publish('song', '9', '7', { rating: 4, body: 'x' })).rejects.toBeInstanceOf(
    NotFoundError,
  );
});

test('test_publish_twice_throwsConflict', async () => {
  const { service } = serviceWith({ alreadyPublished: true });
  const error = await service.publish('album', '1', '7', { rating: 4, body: 'x' }).catch((e) => e);
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.errors).toEqual({ body: ALREADY_PUBLISHED });
});
