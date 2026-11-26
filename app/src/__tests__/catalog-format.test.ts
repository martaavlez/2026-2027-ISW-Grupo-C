import {
  albumTypeLabel,
  albumTypePlural,
  groupByType,
  formatCount,
  formatDuration,
  formatRating,
  formatTotalDuration,
  headline,
  ratingPercentages,
  relativeTime,
  stars,
} from '../features/catalog/format';

test('test_formatRating_usesCommaAndDashWhenEmpty', () => {
  expect(formatRating(4.8)).toBe('4,8');
  expect(formatRating(5)).toBe('5,0');
  expect(formatRating(null)).toBe('–');
});

test('test_formatCount_addsThousandsDot', () => {
  expect(formatCount(312)).toBe('312');
  expect(formatCount(1204)).toBe('1.204');
  expect(formatCount(1234567)).toBe('1.234.567');
});

test('test_formatDuration_andTotal', () => {
  expect(formatDuration(222)).toBe('3:42');
  expect(formatDuration(65)).toBe('1:05');
  expect(formatTotalDuration(2760)).toBe('46 min');
  expect(formatTotalDuration(3900)).toBe('1 h 5 min');
  expect(formatTotalDuration(7200)).toBe('2 h');
});

test('test_stars_roundsAndClamps', () => {
  expect(stars(4)).toBe('★★★★☆');
  expect(stars(5)).toBe('★★★★★');
  expect(stars(9)).toBe('★★★★★');
});

test('test_albumTypeLabel', () => {
  expect(albumTypeLabel('album')).toBe('Álbum');
  expect(albumTypeLabel('ep')).toBe('EP');
  expect(albumTypeLabel('single')).toBe('Single');
});

test('test_ratingPercentages_withAndWithoutRatings', () => {
  expect(ratingPercentages({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 })).toEqual({
    1: 0,
    2: 0,
    3: 25,
    4: 25,
    5: 50,
  });
  expect(ratingPercentages({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })['5']).toBe(0);
});

test.each([
  [20_000, 'ahora mismo'],
  [5 * 60_000, 'hace 5 minutos'],
  [60 * 60_000, 'hace 1 hora'],
  [2 * 86_400_000, 'hace 2 días'],
  [8 * 86_400_000, 'hace 1 semana'],
  [65 * 86_400_000, 'hace 2 meses'],
  [800 * 86_400_000, 'hace 2 años'],
])('test_relativeTime_%p_ms', (elapsed, expected) => {
  const now = new Date('2026-11-26T12:00:00Z');
  expect(relativeTime(new Date(now.getTime() - elapsed).toISOString(), now)).toBe(expected);
});

test('test_headline_skipsMissingParts', () => {
  expect(headline(['Álbum', 2026, 'Dream pop'])).toBe('ÁLBUM · 2026 · DREAM POP');
  expect(headline(['Canción', null, undefined, ''])).toBe('CANCIÓN');
});

test('test_groupByType_keepsOrderAndAllTypes', () => {
  const items = [
    { id: 'a', type: 'single' as const },
    { id: 'b', type: 'album' as const },
    { id: 'c', type: 'single' as const },
  ];

  expect(groupByType(items)).toEqual([
    { type: 'album', items: [items[1]] },
    { type: 'ep', items: [] },
    { type: 'single', items: [items[0], items[2]] },
  ]);
  expect(albumTypePlural('ep')).toBe('EPs');
});
