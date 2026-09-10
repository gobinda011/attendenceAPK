const Attendance = require('../models/Attendance');

// Section 5.1 / FR-011: basic exportable attendance reports.
// Returns plain rows; the controller decides the response format (JSON/CSV).
async function buildAttendanceReport({ startDate, endDate, employeeId }) {
  const query = {};
  if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
  if (employeeId) query.employeeId = employeeId;

  const records = await Attendance.find(query).sort({ date: 1 });

  return records.map((r) => ({
    employeeId: r.employeeId,
    date: r.date,
    checkIn: r.checkIn ? r.checkIn.timestamp : null,
    checkOut: r.checkOut ? r.checkOut.timestamp : null,
    status: r.status,
  }));
}

function toCsv(rows) {
  const header = 'employeeId,date,checkIn,checkOut,status';
  const lines = rows.map((r) =>
    [r.employeeId, r.date, r.checkIn || '', r.checkOut || '', r.status].join(',')
  );
  return [header, ...lines].join('\n');
}

module.exports = { buildAttendanceReport, toCsv };
