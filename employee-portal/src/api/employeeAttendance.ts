import client from './client';

export async function getTodayAttendance(date?: string) {
  const response = await client.get(
    '/employee-attendance/today',
    {
      params: date ? { date } : undefined,
    }
  );

  return response.data;
}

export async function getAttendanceHistory(
  startDate?: string,
  endDate?: string
) {
  const response = await client.get('/employee-attendance/history', {
    params: {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
  });

  return response.data;
}