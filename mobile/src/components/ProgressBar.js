import { StyleSheet, View } from 'react-native';

export default function ProgressBar({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: 4, backgroundColor: '#1b5fbf' },
});
