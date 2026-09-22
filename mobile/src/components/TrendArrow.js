import { StyleSheet, Text, View } from 'react-native';
import {
  TREND_STYLE,
  TREND_UNAVAILABLE_REASON,
  formatRate,
} from '../utils/glucoseDisplay';

export default function TrendArrow({ trend, color, showRate = true }) {
  // No arrow when the trend is unavailable. A horizontal arrow would assert
  // "steady", which is a claim the data does not support.
  if (!trend || !trend.available) {
    const reason =
      TREND_UNAVAILABLE_REASON[trend?.reason] || 'Trend unavailable';

    return (
      <View style={styles.wrap}>
        <Text style={[styles.glyph, styles.muted]}>—</Text>
        <Text style={styles.reason}>{reason}</Text>
      </View>
    );
  }

  const style = TREND_STYLE[trend.direction] || TREND_STYLE.steady;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.glyph, { color }]}>{style.glyph}</Text>
      <View>
        <Text style={[styles.label, { color }]}>{style.label}</Text>
        {showRate ? (
          <Text style={styles.rate}>{formatRate(trend.mgdlPerMinute)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glyph: { fontSize: 22, fontWeight: '700' },
  muted: { color: '#999' },
  label: { fontSize: 14, fontWeight: '600' },
  rate: { fontSize: 11, color: '#777' },
  reason: { fontSize: 12, color: '#999' },
});
