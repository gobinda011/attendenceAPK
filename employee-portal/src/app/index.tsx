import { router } from 'expo-router';
import { useState } from 'react';


import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { loginEmployee } from '@/api/employeeAuth';
import { saveToken } from '@/storage/authStorage';
import { saveTwoFactorChallenge } from '@/storage/twoFactorStorage';
export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!employeeId.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your employee ID and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const data = await loginEmployee(
        employeeId.trim(),
        password
      );

      console.log('Employee login response:', data);

     if (data.requiresPasswordChange) {
  Alert.alert(
    'Password change required',
    'Please change your temporary password.'
  );

 router.push({
  pathname: '/change-password',
  params: {
    employeeId,
  },
});
  return;
}

if (data.requiresTwoFactor && data.challengeToken) {
  await saveTwoFactorChallenge(data.challengeToken);
  router.push('/2fa/login');
  return;
}

if (data.token) {
  await saveToken(data.token);
  router.replace('/home');
  return;
}

Alert.alert(
  'Login successful',
  data.message || 'Employee login successful.'
);
    } catch (error: any) {
      console.log(
        'Employee login error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Login failed',
        error.response?.data?.message ||
          'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Sign in to your employee account
        </Text>

        <Text style={styles.label}>Employee ID</Text>

        <TextInput
          value={employeeId}
          onChangeText={setEmployeeId}
          placeholder="Enter employee ID"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Pressable
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 28,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 36,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#111111',
    backgroundColor: '#fafafa',
  },

  button: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});