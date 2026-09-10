import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import CheckInScreen from './screens/CheckInScreen';
import CheckOutScreen from './screens/CheckOutScreen';

// A tiny hand-rolled 3-screen navigator (Home / Check-in / Check-out) is
// enough for this app's scope; swap in @react-navigation/native for a
// larger app. Employees never see any other screens — no login, no menu,
// exactly per Section 4.2 ("Employee capabilities").
export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'checkin' | 'checkout'

  return (
    <>
      <StatusBar style="dark" />
      {screen === 'home' && <HomeScreen onCheckIn={() => setScreen('checkin')} onCheckOut={() => setScreen('checkout')} />}
      {screen === 'checkin' && <CheckInScreen onDone={() => setScreen('home')} />}
      {screen === 'checkout' && <CheckOutScreen onDone={() => setScreen('home')} />}
    </>
  );
}
