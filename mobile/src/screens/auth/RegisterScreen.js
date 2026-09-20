import { StyleSheet, Text, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Registration wizard</Text>
      <Text style={styles.sub}>Built in stage 1.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 6,
  },
  text: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 13, color: '#888' },
});
