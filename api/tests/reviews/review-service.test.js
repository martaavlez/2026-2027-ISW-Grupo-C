const {
  createReviewService,
  LOGIN_REQUIRED,
  ALREADY_PUBLISHED,
  LOGIN_TO_CHANGE,
  NO_REVIEW,
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
  const reviews = {
    publish: jest.fn().mockResolvedValue(result),
    edit: jest.fn().mockResolvedValue(result),
    remove: jest.fn().mockResolvedValue(result),
  };
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
  const { service } = serviceWith({ refused: true });
  const error = await service.publish('album', '1', '7', { rating: 4, body: 'x' }).catch((e) => e);
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.errors).toEqual({ body: ALREADY_PUBLISHED });
});

// ---------- HU-08 · Editar una reseña ----------

test('test_PA_08_01_edit_savesNewTextRatingAndPrivacy_andReturnsTheNewVersion', async () => {
  const { service, reviews } = serviceWith();

  const result = await service.edit('album', '1', '7', {
    rating: 5,
    body: ' Discazo ',
    privacy: 'friends',
  });

  expect(reviews.edit).toHaveBeenCalledWith({
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
    review: { id: '9', photoUrl: null },
  });
});

test('test_edit_withoutPrivacy_keepsTheOneItHad', async () => {
  const { service, reviews } = serviceWith();
  await service.edit('song', '1', '7', { rating: 3, body: 'Mejor' });
  expect(reviews.edit).toHaveBeenCalledWith(expect.objectContaining({ privacy: null }));
});

test('test_PA_08_02_edit_withoutOwnReview_throwsNotFound', async () => {
  const { service } = serviceWith({ refused: true });
  const error = await service.edit('song', '1', '8', { rating: 3, body: 'x' }).catch((e) => e);
  expect(error).toBeInstanceOf(NotFoundError);
  expect(error.message).toBe(NO_REVIEW);
});

test('test_edit_invalidOrEmpty_isRejectedBeforeSaving', async () => {
  const { service, reviews } = serviceWith();
  // Vaciar la reseña no es editarla: para eso está eliminarla (HU-47).
  await expect(service.edit('song', '1', '7', { rating: 3, body: '  ' })).rejects.toBeInstanceOf(
    ValidationError,
  );
  await expect(service.edit('song', '1', '7', { rating: 9, body: 'x' })).rejects.toBeInstanceOf(
    ValidationError,
  );
  await expect(
    service.edit('song', '1', '7', { rating: 3, body: 'x', privacy: 'todos' }),
  ).rejects.toBeInstanceOf(ValidationError);
  expect(reviews.edit).not.toHaveBeenCalled();
});

test('test_edit_unknownItem_orVisitor', async () => {
  await expect(
    serviceWith(null).service.edit('album', '9', '7', { rating: 3, body: 'x' }),
  ).rejects.toBeInstanceOf(NotFoundError);
  await expect(serviceWith().service.edit('album', '9', null, {})).rejects.toThrow(
    new UnauthorizedError(LOGIN_TO_CHANGE),
  );
});

// ---------- HU-47 · Eliminar una reseña ----------

test('test_PA_47_01_remove_clearsMyReviewAndRatingAndReturnsNewAverage', async () => {
  const { service, reviews } = serviceWith({ removedId: '9', averageRating: 4 });

  const result = await service.remove('song', '3', '7');

  expect(reviews.remove).toHaveBeenCalledWith({ kind: 'song', itemId: '3', userId: '7' });
  expect(result).toEqual({
    myRating: null,
    myReview: null,
    averageRating: 4,
    ratingsCount: 2,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
    removedReviewId: '9',
  });
});

test('test_remove_withoutOwnReview_unknownItem_orVisitor', async () => {
  await expect(serviceWith({ refused: true }).service.remove('song', '3', '8')).rejects.toThrow(
    new NotFoundError(NO_REVIEW),
  );
  await expect(serviceWith(null).service.remove('song', '3', '7')).rejects.toBeInstanceOf(
    NotFoundError,
  );
  await expect(serviceWith().service.remove('song', '3', null)).rejects.toBeInstanceOf(
    UnauthorizedError,
  );
  await expect(serviceWith().service.remove('song', '1; DROP', '7')).rejects.toBeInstanceOf(
    ValidationError,
  );
});
