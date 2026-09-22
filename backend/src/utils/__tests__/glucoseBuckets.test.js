const { bucketReadings, summarise } = require('../glucoseBuckets');

const BASE = new Date('2026-01-01T12:00:00.000Z').getTime();

function readingAt(minutes, valueMgdl) {
  return { valueMgdl, recordedAt: new Date(BASE + minutes * 60000).toISOString() };
}

describe('bucketReadings — raw mode', () => {
  test('returns one point per reading when bucketMinutes is 0', () => {
    const readings = [readingAt(0, 100), readingAt(1, 110), readingAt(2, 120)];

    const points = bucketReadings(readings, {
      from: new Date(BASE),
      to: new Date(BASE + 3 * 60000),
      bucketMinutes: 0,
    });

    expect(points).toHaveLength(3);
    expect(points.map((p) => p.value)).toEqual([100, 110, 120]);
    expect(points.every((p) => p.count === 1)).toBe(true);
  });

  test('returns nothing for no readings', () => {
    const points = bucketReadings([], {
      from: new Date(BASE),
      to: new Date(BASE + 60000),
      bucketMinutes: 0,
    });
    expect(points).toEqual([]);
  });
});

describe('bucketReadings — bucketed mode', () => {
  test('averages readings within a bucket', () => {
    const readings = [
      readingAt(0, 100),
      readingAt(1, 110),
      readingAt(2, 120),
      readingAt(10, 200),
      readingAt(11, 210),
    ];

    const points = bucketReadings(readings, {
      from: new Date(BASE),
      to: new Date(BASE + 20 * 60000),
      bucketMinutes: 10,
    });

    expect(points[0].value).toBe(110);
    expect(points[0].count).toBe(3);
    expect(points[1].value).toBe(205);
    expect(points[1].count).toBe(2);
  });

  test('rounds averages to whole numbers', () => {
    const readings = [readingAt(0, 100), readingAt(1, 101)];

    const points = bucketReadings(readings, {
      from: new Date(BASE),
      to: new Date(BASE + 10 * 60000),
      bucketMinutes: 10,
    });

    expect(points[0].value).toBe(101);
    expect(Number.isInteger(points[0].value)).toBe(true);
  });

  // The reason empty buckets are emitted at all: a gap must render as a
  // break in the chart, not a straight line across missing data.
  test('emits empty buckets as null rather than omitting them', () => {
    const readings = [readingAt(0, 100), readingAt(30, 150)];

    const points = bucketReadings(readings, {
      from: new Date(BASE),
      to: new Date(BASE + 30 * 60000),
      bucketMinutes: 10,
    });

    expect(points).toHaveLength(4);
    expect(points[0].value).toBe(100);
    expect(points[1].value).toBeNull();
    expect(points[2].value).toBeNull();
    expect(points[3].value).toBe(150);
  });

  test('an empty bucket reports a count of zero', () => {
    const points = bucketReadings([readingAt(0, 100)], {
      from: new Date(BASE),
      to: new Date(BASE + 20 * 60000),
      bucketMinutes: 10,
    });

    expect(points[1].count).toBe(0);
  });

  test('every bucket in the window is present when there are no readings', () => {
    const points = bucketReadings([], {
      from: new Date(BASE),
      to: new Date(BASE + 60 * 60000),
      bucketMinutes: 10,
    });

    expect(points).toHaveLength(7);
    expect(points.every((p) => p.value === null)).toBe(true);
  });

  test('points are in chronological order', () => {
    const readings = [readingAt(20, 130), readingAt(0, 100), readingAt(10, 115)];

    const points = bucketReadings(readings, {
      from: new Date(BASE),
      to: new Date(BASE + 20 * 60000),
      bucketMinutes: 10,
    });

    const times = points.map((p) => new Date(p.t).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe('summarise', () => {
  test('computes count, min, max and average', () => {
    const points = [
      { value: 100 },
      { value: 150 },
      { value: 200 },
    ];

    expect(summarise(points)).toEqual({
      count: 3,
      min: 100,
      max: 200,
      average: 150,
    });
  });

  test('ignores null buckets', () => {
    const points = [{ value: 100 }, { value: null }, { value: 200 }];
    const result = summarise(points);

    expect(result.count).toBe(2);
    expect(result.average).toBe(150);
  });

  test('handles an all-null window without dividing by zero', () => {
    const result = summarise([{ value: null }, { value: null }]);

    expect(result).toEqual({ count: 0, min: null, max: null, average: null });
  });
});
