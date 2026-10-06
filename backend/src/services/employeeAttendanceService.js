const Attendance = require('../models/Attendance');

function calculateWorkingHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return null;
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const durationMs = end.getTime() - start.getTime();

  if (durationMs < 0) {
    return null;
  }

  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    totalMinutes,
    hours,
    minutes,
    formatted: `${hours}h ${String(minutes).padStart(2, '0')}m`,
  };
}

function formatAttendanceRecord(record) {
  const checkIn = record.checkIn?.timestamp || null;
  const checkOut = record.checkOut?.timestamp || null;

  return {
    date: record.date,
    status: record.status,
    checkIn,
    checkOut,
    workingHours: calculateWorkingHours(checkIn, checkOut),
  };
}

async function getTodayAttendance(employeeId, date) {
  const record = await Attendance.findOne({
    employeeId,
    date,
  });

  if (!record) {
    return null;
  }

  return formatAttendanceRecord(record);
}

async function getAttendanceHistory(employeeId, filters = {}) {
  const query = {
    employeeId,
  };

  if (filters.startDate || filters.endDate) {
    query.date = {};

    if (filters.startDate) {
      query.date.$gte = filters.startDate;
    }

    if (filters.endDate) {
      query.date.$lte = filters.endDate;
    }
  }

  const records = await Attendance.find(query)
    .sort({ date: -1 })
    .lean();

  return records.map(formatAttendanceRecord);
}

module.exports = {
  calculateWorkingHours,
  formatAttendanceRecord,
  getTodayAttendance,
  getAttendanceHistory,
};