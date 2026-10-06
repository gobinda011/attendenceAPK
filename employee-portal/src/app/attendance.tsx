import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { getTodayAttendance } from '@/api/employeeAttendance';

type WorkingHours = {
  totalMinutes: number;
  hours: number;
  minutes: number;
  formatted: string;
};

type Attendance = {
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: WorkingHours | null;
};

export default function AttendanceScreen() {
  const [attendance, setAttendance] =
    useState<Attendance | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAttendance = useCallback(async () => {
    try {
      setError('');

      const response = await getTodayAttendance();

      setAttendance(response.attendance || null);
    } catch (err: any) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message;

  if (status === 403) {
    setError(
      message ||
        'Two-factor authentication is required to access attendance information.'
    );
  } else {
    setError(message || 'Unable to load today attendance.');
  }

  setAttendance(null);
} 
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await loadAttendance();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loadAttendance]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadAttendance();
    } finally {
      setRefreshing(false);
    }
  }

  function formatTime(value: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(value: string) {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString([], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading attendance...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Today's Attendance
        </Text>

        <Text style={styles.subtitle}>
          Your attendance information for today
        </Text>

       {error ? (
  <View style={styles.errorBox}>
    <Text style={styles.errorTitle}>
      Two-factor authentication required
    </Text>

    <Text style={styles.errorText}>
      {error}
    </Text>

    <Pressable
      style={styles.securityButton}
      onPress={() => router.push('/security')}
    >
      <Text style={styles.securityButtonText}>
        Open Security & 2FA
      </Text>
    </Pressable>
  </View>
) : attendance ? (
  <>
    <View style={styles.dateCard}>
      <Text style={styles.dateLabel}>Date</Text>
      <Text style={styles.dateValue}>
        {formatDate(attendance.date)}
      </Text>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>
          {attendance.status}
        </Text>
      </View>
    </View>

    <View style={styles.grid}>
      <View style={styles.infoCard}>
        <Text style={styles.cardLabel}>Check-in</Text>
        <Text style={styles.cardValue}>
          {formatTime(attendance.checkIn)}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardLabel}>Check-out</Text>
        <Text style={styles.cardValue}>
          {formatTime(attendance.checkOut)}
        </Text>
      </View>
    </View>

    <View style={styles.hoursCard}>
      <Text style={styles.cardLabel}>Working hours</Text>

      <Text style={styles.hoursValue}>
        {attendance.workingHours?.formatted || '—'}
      </Text>

      {!attendance.workingHours && (
        <Text style={styles.helperText}>
          Working hours will be available after both check-in and check-out.
        </Text>
      )}
    </View>
  </>
) : (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyTitle}>
      No attendance record
    </Text>

    <Text style={styles.emptyText}>
      There is no attendance record available for today.
    </Text>
  </View>
)}
        <Pressable
          style={styles.historyButton}
          onPress={() => router.push('/attendance-history')}
        >
          <Text style={styles.historyButtonText}>
            View Attendance History
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },


  errorTitle: {
  fontSize: 17,
  fontWeight: '700',
  color: '#111',
  marginBottom: 8,
},

securityButton: {
  height: 48,
  borderRadius: 10,
  backgroundColor: '#111',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 16,
},

securityButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
},

  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fb',
  },

  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 15,
  },

  backButton: {
    marginBottom: 24,
  },

  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: '#666',
    fontSize: 15,
  },

  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },

  dateLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 6,
  },

  dateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },

  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eeeeee',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },

  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },

  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
  },

  cardLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
  },

  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },

  hoursCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },

  hoursValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },

  helperText: {
    marginTop: 8,
    fontSize: 13,
    color: '#777',
    lineHeight: 18,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  historyButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  historyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  errorBox: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e0b4b4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  errorText: {
    color: '#b71c1c',
    fontSize: 14,
    lineHeight: 20,
  },
});