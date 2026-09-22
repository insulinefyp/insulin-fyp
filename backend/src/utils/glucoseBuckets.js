// Pure: readings and a window in, chart points out.

// Every bucket in the window is emitted, including empty ones as null. A gap
// must render as a break in the line, not a straight segment implying data
// that was never recorded.
function bucketReadings(readings, { from, to, bucketMinutes }) {
  if (!bucketMinutes || bucketMinutes <= 0) {
    return readings.map((r) => ({
      t: new Date(r.recordedAt).toISOString(),
      value: r.valueMgdl,
      count: 1,
    }));
  }

  const bucketMs = bucketMinutes * 60000;
  const startMs = Math.floor(new Date(from).getTime() / bucketMs) * bucketMs;
  const endMs = new Date(to).getTime();

  const sums = new Map();

  readings.forEach((r) => {
    const ms = new Date(r.recordedAt).getTime();
    const key = Math.floor(ms / bucketMs) * bucketMs;
    const entry = sums.get(key) || { sum: 0, count: 0 };
    entry.sum += r.valueMgdl;
    entry.count += 1;
    sums.set(key, entry);
  });

  const out = [];

  for (let ms = startMs; ms <= endMs; ms += bucketMs) {
    const entry = sums.get(ms);
    out.push({
      t: new Date(ms).toISOString(),
      value: entry ? Math.round(entry.sum / entry.count) : null,
      count: entry ? entry.count : 0,
    });
  }

  return out;
}

function summarise(points) {
  const values = points.map((p) => p.value).filter((v) => v !== null);

  if (values.length === 0) {
    return { count: 0, min: null, max: null, average: null };
  }

  const sum = values.reduce((s, v) => s + v, 0);

  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: Math.round(sum / values.length),
  };
}

module.exports = { bucketReadings, summarise };
