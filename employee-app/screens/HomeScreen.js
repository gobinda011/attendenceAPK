import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Section 16: App Flow - Home screen with CHECK IN / CHECK OUT.
export default function HomeScreen({ onCheckIn, onCheckOut }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ATTENDANCE SYSTEM</Text>
      <Text style={styles.greeting}>{greeting} 👋</Text>

      <TouchableOpacity style={[styles.button, styles.checkIn]} onPress={onCheckIn}>
        <Text style={styles.buttonText}>CHECK IN</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.checkOut]} onPress={onCheckOut}>
        <Text style={styles.buttonText}>CHECK OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFEDE7', padding: 24 },
  title: { fontSize: 14, letterSpacing: 2, color: '#6B7178', marginBottom: 8 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#1C2127', marginBottom: 48 },
  button: { width: '100%', paddingVertical: 20, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  checkIn: { backgroundColor: '#3a996d' },
  checkOut: { backgroundColor: '#e61c1c' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});
