import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useGlucoseHistory, useGlucoseRanges } from '../hooks/useGlucose';
import { useTreatment } from '../hooks/useTreatment';
import { targetRange } from '../utils/glucoseDisplay';
import {
  axisBounds,
  formatTimeLabel,
  labelIndices,
  splitIntoSegments,
  toChartData,
} from '../utils/chartData';

const CHART_HEIGHT = 200;
const AXIS_LABEL_STYLE = { fontSize: 10, color: '#999' };

export default function GlucoseChart() {
  const ranges = useGlucoseRanges();
  const treatment = useTreatment();
  const [range, setRange] = useState(null);

  const activeRange = range || ranges.data?.defaultRange;
  const history = useGlucoseHistory(activeRange);

  if (ranges.isPending || history.isPending) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (ranges.isError || history.isError) {
    const err = ranges.error || history.error;
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Chart unavailable</Text>
        <Text style={styles.muted}>
          {err.code === 'NETWORK' || err.code === 'TIMEOUT'
            ? 'Cannot reach the server.'
            : err.message}
        </Text>
        <TouchableOpacity style={styles.retry} onPress={() => history.refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { points, summary, bucketMinutes, readingCount } = history.data;
  const target = targetRange(treatment.data?.parameters);
  const segments = splitIntoSegments(points);
  const bounds = axisBounds(points, target);

  const rangeButtons = (
    <View style={styles.rangeRow}>
      {ranges.data.ranges.map((r) => {
        const selected = r.key === activeRange;
        return (
          <TouchableOpacity
            key={r.key}
            style={[styles.rangeButton, selected && styles.rangeButtonActive]}
            onPress={() => setRange(r.key)}
          >
            <Text style={[styles.rangeText, selected && styles.rangeTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (readingCount === 0) {
    return (
      <View style={styles.card}>
        {rangeButtons}
        <View style={styles.empty}>
          <Text style={styles.muted}>No readings in this window yet.</Text>
        </View>
      </View>
    );
  }

  // The longest run of consecutive readings drives the line; shorter runs
  // either side of a gap are drawn as additional datasets.
  const ordered = [...segments].sort((a, b) => b.length - a.length);
  const primary = ordered[0] || [];
  const extras = ordered.slice(1, 3);

  const labelled = labelIndices(primary.length, 4);

  // Every object here is freshly built. The chart library writes its own
  // flags onto the data it receives, and anything reused from the query
  // cache is frozen in development.
  const chartData = primary.map((p, i) => ({
    value: p.value,
    ...(labelled.has(i)
      ? { label: formatTimeLabel(p.t), labelTextStyle: { ...AXIS_LABEL_STYLE } }
      : {}),
    hideDataPoint: primary.length > 40,
  }));

  return (
    <View style={styles.card}>
      {rangeButtons}

      <View style={styles.chartWrap}>
        <LineChart
          data={chartData}
          data2={extras[0] ? toChartData(extras[0]) : undefined}
          data3={extras[1] ? toChartData(extras[1]) : undefined}
          height={CHART_HEIGHT}
          initialSpacing={8}
          endSpacing={8}
          adjustToWidth
          thickness={2}
          color="#1b5fbf"
          color2="#1b5fbf"
          color3="#1b5fbf"
          dataPointsColor="#1b5fbf"
          dataPointsRadius={2}
          yAxisOffset={bounds.min}
          maxValue={bounds.max - bounds.min}
          noOfSections={4}
          yAxisTextStyle={AXIS_LABEL_STYLE}
          rulesColor="#eee"
          yAxisColor="#ddd"
          xAxisColor="#ddd"
          showReferenceLine1
          referenceLine1Position={target.low - bounds.min}
          referenceLine1Config={{
            color: '#1b7f3b',
            dashWidth: 4,
            dashGap: 4,
            thickness: 1,
          }}
          showReferenceLine2
          referenceLine2Position={target.high - bounds.min}
          referenceLine2Config={{
            color: '#1b7f3b',
            dashWidth: 4,
            dashGap: 4,
            thickness: 1,
          }}
        />
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={styles.legendDash} />
          <Text style={styles.legendText}>
            Target {target.low}–{target.high}
          </Text>
        </View>
        {segments.length > 1 ? (
          <Text style={styles.legendText}>
            {segments.length - 1} gap{segments.length > 2 ? 's' : ''} in data
          </Text>
        ) : null}
      </View>

      <View style={styles.summaryRow}>
        <Summary label="Low" value={summary.min} />
        <Summary label="Average" value={summary.average} />
        <Summary label="High" value={summary.max} />
        <Summary
          label="Points"
          value={bucketMinutes > 0 ? summary.count : readingCount}
        />
      </View>

      {bucketMinutes > 0 ? (
        <Text style={styles.note}>
          Averaged into {bucketMinutes}-minute buckets ({readingCount} readings)
        </Text>
      ) : null}
    </View>
  );
}

function Summary({ label, value }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value ?? '—'}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  center: { alignItems: 'center', justifyContent: 'center', height: 240 },
  chartWrap: { marginLeft: -8 },
  empty: { height: 120, alignItems: 'center', justifyContent: 'center' },
  rangeRow: { flexDirection: 'row', gap: 6 },
  rangeButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },
  rangeButtonActive: { backgroundColor: '#1b5fbf' },
  rangeText: { fontSize: 13, color: '#555', fontWeight: '500' },
  rangeTextActive: { color: '#fff' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDash: {
    width: 16,
    height: 0,
    borderTopWidth: 1,
    borderColor: '#1b7f3b',
    borderStyle: 'dashed',
  },
  legendText: { fontSize: 11, color: '#888' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#111' },
  summaryLabel: { fontSize: 11, color: '#888' },
  note: { fontSize: 11, color: '#999', textAlign: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#111' },
  muted: { fontSize: 13, color: '#777' },
  retry: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#e8e8e8',
  },
  retryText: { fontSize: 13, fontWeight: '500' },
});
