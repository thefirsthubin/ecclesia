/**
 * Placeholder root component for the Ecclesia mobile app (PRD §11.4,
 * §11.5, §11.6, §11.7 - Shepherds, Basonta Leaders, Treasurers, Members).
 * Offline-first attendance/offering capture (Blueprint §8.4, NFR-OFF-01/02)
 * is the eventual purpose of this app - none of that exists yet. This
 * screen exists only to prove the React Native/Metro/Nx wiring works.
 */
import { SafeAreaView, StyleSheet, Text } from 'react-native';

export function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Ecclesia</Text>
      <Text>Sprint 0 scaffold - no screens implemented yet.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default App;
