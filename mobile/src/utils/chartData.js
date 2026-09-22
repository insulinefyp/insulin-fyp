// Turns the server's points into what the chart library needs.

// The library has no concept of a hole in a line, so a run of nulls becomes
// a break between separate segments. A sensor dropout must look like missing
// data, not like a straight line between the readings either side of it.
export function splitIntoSegments(points) {
  const segments = [];
  let current = [];

  points.forEach((p) => {
    if (p.value === null) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      return;
    }
    current.push(p);
  });

  if (current.length > 0) segments.push(current);

  // A single isolated point would draw nothing as a line, so it is kept and
  // rendered as a dot by the chart component.
  return segments;
}

// The chart library mutates the objects it is given (it writes an
// isActiveClone flag onto each one). TanStack Query freezes cached data in
// development, so every point must be a fresh plain object rather than
// anything derived from the cache.
export function toChartData(segment) {
  return segment.map((p) => ({ value: p.value, t: p.t }));
}

// Y axis: covers the data and the target band, with padding, snapped to 20s.
export function axisBounds(points, target) {
  const values = points.map((p) => p.value).filter((v) => v !== null);

  const dataMin = values.length > 0 ? Math.min(...values) : target.low;
  const dataMax = values.length > 0 ? Math.max(...values) : target.high;

  const min = Math.min(dataMin, target.low) - 20;
  const max = Math.max(dataMax, target.high) + 20;

  return {
    min: Math.max(0, Math.floor(min / 20) * 20),
    max: Math.ceil(max / 20) * 20,
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatTimeLabel(iso) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Roughly `count` evenly spaced labels, so the axis never crowds.
export function labelIndices(length, count = 4) {
  if (length <= count) {
    return new Set(Array.from({ length }, (_, i) => i));
  }
  const step = Math.floor(length / (count - 1));
  const out = new Set();
  for (let i = 0; i < length; i += step) out.add(i);
  out.add(length - 1);
  return out;
}
