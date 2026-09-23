import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet , Image,Dimensions} from 'react-native';

// Section 16: App Flow - Home screen with CHECK IN / CHECK OUT.
export default function HomeScreen({ onCheckIn, onCheckOut }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
// Get the full device height and width dynamically
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  return (
    <View style={{ flex: 1 }}>
      {/* Background Image sits behind everything */}  
      <Image 
        source={require('./img.jpeg')} 
        style={styles.backgroundImage}
      />
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 24 },//#EFEDE7
  title: { fontSize: 14, letterSpacing: 2, color: '#6B7178', marginBottom: 8 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#1C2127', marginBottom: 48 },
  button: { width: '70%', paddingVertical: 20, borderRadius: 50, alignItems: 'center', marginBottom: 16 },
  checkIn: { backgroundColor: '#3a996d' },
  checkOut: { backgroundColor: '#e61c1c' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
 
  backgroundImage: { 
    position: 'absolute', 
    top: 0,  
    left: 30, 
    right: 0, 
    bottom: 80, 
    width: '80%',
    height: '80%',
    resizeMode: 'contain'
  },
});
