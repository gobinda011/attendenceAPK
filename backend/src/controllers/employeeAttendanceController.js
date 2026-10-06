const {
  getTodayAttendance,
  getAttendanceHistory,
} = require('../services/employeeAttendanceService');

const { success, failure } = require('../utils/response');
const { todayKey } = require('../utils/date');

async function today(req, res, next) {
  try {
    const attendance = await getTodayAttendance(
      req.employee.employeeId,
      todayKey()
    );

    return success(res, 200, 'Today attendance retrieved', {
      attendance,
    });
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return failure(res, 400, 'Invalid startDate format. Use YYYY-MM-DD');
    }

    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return failure(res, 400, 'Invalid endDate format. Use YYYY-MM-DD');
    }

    if (startDate && endDate && startDate > endDate) {
      return failure(res, 400, 'startDate cannot be after endDate');
    }

    const records = await getAttendanceHistory(
      req.employee.employeeId,
      {
        startDate,
        endDate,
      }
    );

    return success(res, 200, 'Attendance history retrieved', {
      records,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  today,
  history,
};