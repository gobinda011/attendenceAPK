import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { getEmployeeProfile } from '@/api/employeeAuth';

type Employee = {
  employeeId: string;
  name: string;
  email?: string;
  department?: string;
  designation?: string;
};

export default function HomeScreen() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError('');

      const data = await getEmployeeProfile();

      setEmployee(data.employee);
    } catch (err: any) {
      console.log(
        'Profile loading error:',
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          'Unable to load employee profile.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Something went wrong
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Employee profile not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Welcome back,
      </Text>

      <Text style={styles.name}>
        {employee.name}
      </Text>

      <Text style={styles.subtitle}>
        Employee Portal
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          My Profile
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>
            Employee ID
          </Text>

          <Text style={styles.value}>
            {employee.employeeId}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Email
          </Text>

          <Text style={styles.value}>
            {employee.email || 'Not provided'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Department
          </Text>

          <Text style={styles.value}>
            {employee.department || 'Not provided'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>
            Designation
          </Text>

          <Text style={styles.value}>
            {employee.designation || 'Not provided'}
          </Text>
        </View>
      </View>

<Pressable
  style={styles.attendanceButton}
  onPress={() => router.push('/attendance')}
>
  <Text style={styles.attendanceButtonText}>Attendance</Text>
</Pressable>

      <Pressable
        style={styles.securityButton}
        onPress={() => router.push('/security')}
      >
        <Text style={styles.securityButtonText}>
          Security & 2FA
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 28,
    paddingTop: 70,
  },

  center: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666666',
  },

  greeting: {
    fontSize: 18,
    color: '#666666',
  },

  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    marginTop: 4,
  },

  subtitle: {
    fontSize: 15,
    color: '#777777',
    marginTop: 6,
    marginBottom: 32,
  },

  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 20,
  },

  row: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },

  attendanceButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  attendanceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  securityButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  securityButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },

  errorText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
});