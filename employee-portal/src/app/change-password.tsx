import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { changeEmployeePassword } from '@/api/employeeAuth';

export default function ChangePasswordScreen() {
  const { employeeId } = useLocalSearchParams<{
    employeeId?: string;
  }>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    if (!employeeId) {
      Alert.alert(
        'Error',
        'Employee information is missing. Please log in again.'
      );
      router.replace('/');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        'Invalid password',
        'New password must be at least 8 characters long.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Password mismatch',
        'New password and confirm password do not match.'
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        'Invalid password',
        'New password must be different from the temporary password.'
      );
      return;
    }

    setLoading(true);

    try {
      await changeEmployeePassword(
        employeeId,
        currentPassword,
        newPassword
      );

      Alert.alert(
        'Password changed',
        'Your password has been changed successfully. Please log in with your new password.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/'),
          },
        ]
      );
      } catch (err: any) {
  Alert.alert(
    'Could not change password',
    err?.response?.data?.message ||
      err?.message ||
      'Something went wrong while changing your password.'
  );
}
    finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Change Password</Text>

        <Text style={styles.subtitle}>
          You are using a temporary password. Please create a new
          password before continuing.
        </Text>

        <Text style={styles.label}>Employee ID</Text>
        <TextInput
          value={employeeId || ''}
          editable={false}
          style={[styles.input, styles.disabledInput]}
        />

        <Text style={styles.label}>Temporary password</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter temporary password"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>New password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.hint}>
          Minimum 8 characters.
        </Text>

        <Text style={styles.label}>Confirm new password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter new password"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <Pressable
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Changing password…' : 'Change Password'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f7fb',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 22,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    fontSize: 15,
  },

  disabledInput: {
    backgroundColor: '#f0f2f5',
    color: '#666',
  },

  hint: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },

  button: {
    height: 50,
    borderRadius: 10,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});