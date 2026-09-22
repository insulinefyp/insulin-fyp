import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlucoseReadingCard from '../components/GlucoseReadingCard';
import GlucoseChart from '../components/GlucoseChart';
import SimulatorPanel from '../components/SimulatorPanel';
import { useCurrentGlucose } from '../hooks/useGlucose';

export default function GlucoseScreen() {
  const { data, refetch, isRefetching } = useCurrentGlucose();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <GlucoseReadingCard />

      <GlucoseChart />

      {data ? (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Source: {data.source} · one reading every {data.intervalSeconds} s ·
            marked stale after {data.staleAfterSeconds} s without data · trend
            measured over {data.trendWindowMinutes} min
          </Text>
        </View>
      ) : null}

      <SimulatorPanel />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  info: { paddingHorizontal: 4 },
  infoText: { fontSize: 12, color: '#888', lineHeight: 17 },
});
