const attendanceService = require('../services/attendanceService');
const { success, failure } = require('../utils/response');
const { formatTime } = require('../utils/date');

// FR-006 / FR-007: Check-In.
async function checkIn(req, res, next) {
  try {
    if (!req.file) return failure(res, 400, 'Face image is required');

    const result = await attendanceService.checkIn(req.file.buffer);

    return success(res, 200, result.message, {
      alreadyCheckedIn: result.alreadyCheckedIn,
      employee: { employeeId: result.employee.employeeId, name: result.employee.name },
      attendance: {
        date: result.attendance.date,
        checkIn: formatTime(result.attendance.checkIn.timestamp),
        status: result.attendance.status,
      },
    });
  } catch (err) {
    if (err.statusCode) return failure(res, err.statusCode, err.message);
    next(err);
  }
}

// FR-008 / FR-009: Check-Out.
async function checkOut(req, res, next) {
  try {
    if (!req.file) return failure(res, 400, 'Face image is required');

    const result = await attendanceService.checkOut(req.file.buffer);

    return success(res, 200, result.message, {
      alreadyCheckedOut: result.alreadyCheckedOut,
      employee: { employeeId: result.employee.employeeId, name: result.employee.name },
      attendance: {
        date: result.attendance.date,
        checkIn: formatTime(result.attendance.checkIn.timestamp),
        checkOut: result.attendance.checkOut ? formatTime(result.attendance.checkOut.timestamp) : null,
        status: result.attendance.status,
      },
    });
  } catch (err) {
    if (err.statusCode) return failure(res, err.statusCode, err.message);
    next(err);
  }
}

// Section 33: attendance listing/filtering for the admin dashboard.
async function list(req, res, next) {
  try {
    const { date, employeeId, status, month, year } = req.query;
    const records = await attendanceService.listAttendance({ date, employeeId, status, month, year });
    return success(res, 200, 'Attendance retrieved', { records });
  } catch (err) {
    next(err);
  }
}

async function today(req, res, next) {
  try {
    const records = await attendanceService.listAttendance({ date: require('../utils/date').todayKey() });
    return success(res, 200, "Today's attendance retrieved", { records });
  } catch (err) {
    next(err);
  }
}

async function byEmployee(req, res, next) {
  try {
    const records = await attendanceService.listAttendance({ employeeId: req.params.employeeId });
    return success(res, 200, 'Employee attendance history retrieved', { records });
  } catch (err) {
    next(err);
  }
}

// FR-011: admin correction, fully audited.
async function update(req, res, next) {
  try {
    const record = await attendanceService.adminUpdateAttendance(req.params.id, req.body, req.admin.id);
    return success(res, 200, 'Attendance updated', { record });
  } catch (err) {
    if (err.statusCode) return failure(res, err.statusCode, err.message);
    next(err);
  }
}

// Section 30: standalone recognition endpoint (identification only, no
// attendance side-effects) - useful for admin testing / kiosk "who is this" UI.
async function verify(req, res, next) {
  try {
    if (!req.file) return failure(res, 400, 'Face image is required');
    const attendanceService = require('../services/attendanceService');
    const { employee, confidence } = await attendanceService.identifyEmployeeFromImage
      ? await attendanceService.identifyEmployeeFromImage(req.file.buffer)
      : {};
    return success(res, 200, 'Face verified', {
      matched: true,
      employeeId: employee.employeeId,
      confidence,
    });
  } catch (err) {
    if (err.statusCode) {
      return success(res, 200, err.message, { matched: false, employeeId: null, confidence: 0 });
    }
    next(err);
  }
}

module.exports = { checkIn, checkOut, list, today, byEmployee, update, verify };
