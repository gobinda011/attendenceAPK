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

import { getAttendanceHistory } from '@/api/employeeAttendance';

type WorkingHours = {
  totalMinutes: number;
  hours: number;
  minutes: number;
  formatted: string;
};

type AttendanceRecord = {
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: WorkingHours | null;
};

export default function AttendanceHistoryScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      setError('');

      const now = new Date();

      const year = now.getFullYear();
      const month = now.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = formatDateForApi(firstDay);
      const endDate = formatDateForApi(lastDay);

      const response = await getAttendanceHistory(startDate, endDate);

      setRecords(response.records || []);
    } catch (err: any) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message;

  if (status === 403) {
    setError(
      message ||
        'Two-factor authentication is required to access attendance history.'
    );
  } else {
    setError(message || 'Unable to load attendance history.');
  }

  setRecords([]);
}
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await loadHistory();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loadHistory]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  }

  function formatDateForApi(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(value: string) {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatTime(value: string | null) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatMonth() {
    return new Date().toLocaleDateString([], {
      month: 'long',
      year: 'numeric',
    });
  }

  const presentCount = records.length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading attendance history...
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
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Attendance History</Text>

        <Text style={styles.subtitle}>
          Attendance records for {formatMonth()}
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
) : (
  <>
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>Present days</Text>

      <Text style={styles.summaryValue}>
        {presentCount}
      </Text>

      <Text style={styles.summaryHelper}>
        Based on attendance records available this month
      </Text>
    </View>

    <Text style={styles.sectionTitle}>
      Attendance Records
    </Text>

    {records.length === 0 ? (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>
          No attendance records
        </Text>

        <Text style={styles.emptyText}>
          No attendance records are available for this month.
        </Text>
      </View>
    ) : (
      records.map((record) => (
        <View
          key={record.date}
          style={styles.recordCard}
        >
          <View style={styles.recordHeader}>
            <View>
              <Text style={styles.recordDate}>
                {formatDisplayDate(record.date)}
              </Text>

              <Text style={styles.recordStatus}>
                {record.status}
              </Text>
            </View>

            <View style={styles.presentBadge}>
              <Text style={styles.presentBadgeText}>
                Present
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Check-in
              </Text>

              <Text style={styles.detailValue}>
                {formatTime(record.checkIn)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Check-out
              </Text>

              <Text style={styles.detailValue}>
                {formatTime(record.checkOut)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Working hours
              </Text>

              <Text style={styles.detailValue}>
                {record.workingHours?.formatted || '—'}
              </Text>
            </View>
          </View>
        </View>
      ))
    )}
  </>
)}
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

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },

  summaryLabel: {
    fontSize: 14,
    color: '#777',
  },

  summaryValue: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: '700',
    color: '#111',
  },

  summaryHelper: {
    marginTop: 6,
    fontSize: 13,
    color: '#777',
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 19,
    fontWeight: '700',
    color: '#111',
  },

  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },

  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  recordDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  recordStatus: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
    textTransform: 'capitalize',
  },

  presentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eeeeee',
  },

  presentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 16,
  },

  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
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