const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { todayKey } = require('../utils/date');

// FR-012 / Section 34: dashboard analytics.
async function summary() {
  const date = todayKey();
  const totalEmployees = await Employee.countDocuments({ status: 'active' });
  const todaysRecords = await Attendance.find({ date });

  const present = todaysRecords.length;
  const checkedOut = todaysRecords.filter((r) => r.status === 'checked_out').length;
  const absent = Math.max(totalEmployees - present, 0);
  const attendancePercentage = totalEmployees
    ? Number(((present / totalEmployees) * 100).toFixed(2))
    : 0;

  return { totalEmployees, present, absent, checkedOut, attendancePercentage, date };
}

async function todaysAttendance() {
  const date = todayKey();
  return Attendance.find({ date }).sort({ 'checkIn.timestamp': 1 });
}

async function monthly(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const records = await Attendance.find({ date: new RegExp(`^${prefix}`) });
  const byDate = {};
  for (const r of records) {
    byDate[r.date] = byDate[r.date] || { present: 0, checkedOut: 0 };
    byDate[r.date].present += 1;
    if (r.status === 'checked_out') byDate[r.date].checkedOut += 1;
  }
  return byDate;
}

async function byDepartment() {
  const employees = await Employee.find({ status: 'active' }).select('department employeeId');
  const date = todayKey();
  const present = new Set((await Attendance.find({ date })).map((a) => a.employeeId));

  const stats = {};
  for (const e of employees) {
    const dept = e.department || 'Unassigned';
    stats[dept] = stats[dept] || { total: 0, present: 0 };
    stats[dept].total += 1;
    if (present.has(e.employeeId)) stats[dept].present += 1;
  }
  return stats;
}

module.exports = { summary, todaysAttendance, monthly, byDepartment };
