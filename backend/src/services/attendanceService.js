const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const faceService = require('./faceService');
const env = require('../config/environment');
const { todayKey, formatTime } = require('../utils/date');

class AttendanceError extends Error {
  constructor(message, statusCode = 400, code = 'ATTENDANCE_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Runs face recognition against every active, face-registered employee and
 * applies the confidence threshold (FR-004, FR-005, Rule 3).
 * Throws AttendanceError if there is no confident match.
 */
async function identifyEmployeeFromImage(imageBuffer) {
  const candidates = await Employee.find({
    status: 'active',
    faceRegistered: true,
  }).select('employeeId name status faceRegistered  faceEmbeddings');
console.log(
  '[DEBUG] Face recognition candidates:',
  candidates.map(e => ({
    employeeId: e.employeeId,
    name: e.name,
    status: e.status,
    faceRegistered: e.faceRegistered,
    embeddings: e.faceEmbeddings?.length
  }))
);

  if (candidates.length === 0) {
    throw new AttendanceError('No registered employees to match against', 422, 'NO_CANDIDATES');
  }

  const registeredEmployees = candidates.map((e) => ({
    employeeId: e.employeeId,
    embeddings: e.faceEmbeddings.map((f) => f.vector),
  }));


  const result = await faceService.recognizeFace(imageBuffer, registeredEmployees);

  if (!result.matched || result.confidence < env.faceMatchThreshold) {
    // FR-005: Unknown Face Rejection - no attendance record is created.
    throw new AttendanceError(
      'Face not recognized. Please ensure good lighting and face the camera directly.',
      401,
      'FACE_NOT_RECOGNIZED'
    );
  }

  const employee = candidates.find((e) => e.employeeId === result.employeeId);
  if (!employee) {
    throw new AttendanceError('Matched employee record could not be found', 404, 'EMPLOYEE_NOT_FOUND');
  }
  if (employee.status !== 'active') {
    // Rule 1: only active employees can record attendance.
    throw new AttendanceError('This employee account is not active', 403, 'EMPLOYEE_INACTIVE');
  }

  return { employee, confidence: result.confidence };
}

/**
 * FR-006 / FR-007: Check-in with duplicate prevention.
 */
async function checkIn(imageBuffer) {
  const { employee, confidence } = await identifyEmployeeFromImage(imageBuffer);
  const date = todayKey();

  const existing = await Attendance.findOne({ employeeId: employee.employeeId, date });
  if (existing) {
    // Not an error - this is a valid, expected state (Section 20: "Already Checked In").
    return {
      alreadyCheckedIn: true,
      employee,
      attendance: existing,
      message: `Welcome back, ${employee.name}! You were already marked present today.`,
    };
  }

  const attendance = await Attendance.create({
    employeeId: employee.employeeId,
    date,
    checkIn: {
      timestamp: new Date(),
      verificationScore: confidence,
      verificationMethod: 'face_embedding',
    },
    status: 'present',
  });

  return {
    alreadyCheckedIn: false,
    employee,
    attendance,
    message: `Welcome, ${employee.name}! You are marked present.`,
  };
}

/**
 * FR-008 / FR-009: Check-out with validation against an existing check-in.
 */
async function checkOut(imageBuffer) {
  const { employee, confidence } = await identifyEmployeeFromImage(imageBuffer);
  const date = todayKey();

  const attendance = await Attendance.findOne({ employeeId: employee.employeeId, date });

  if (!attendance || !attendance.checkIn) {
    // Rule 6: check-out requires an existing check-in.
    throw new AttendanceError(
      'No check-in record was found for today. Please check in first.',
      400,
      'NO_CHECKIN'
    );
  }
  if (attendance.checkOut && attendance.checkOut.timestamp) {
    // Rule 7: check-out can only be recorded once.
    return {
      alreadyCheckedOut: true,
      employee,
      attendance,
      message: "Today's checkout was already recorded.",
    };
  }

  attendance.checkOut = {
    timestamp: new Date(),
    verificationScore: confidence,
    verificationMethod: 'face_embedding',
  };
  attendance.status = 'checked_out';
  await attendance.save();

  return {
    alreadyCheckedOut: false,
    employee,
    attendance,
    message: `Goodbye, ${employee.name}! Have a great day.`,
  };
}

async function listAttendance(filters = {}) {
  const query = {};
  if (filters.date) query.date = filters.date;
  if (filters.employeeId) query.employeeId = filters.employeeId;
  if (filters.status) query.status = filters.status;
  if (filters.month && filters.year) {
    const prefix = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
    query.date = new RegExp(`^${prefix}`);
  }
  return Attendance.find(query).sort({ date: -1 });
}

/**
 * FR-011: admin correction of attendance. Every modification is written to
 * the audit log (Rule 8) with the previous and new values.
 */
async function adminUpdateAttendance(attendanceId, updates, adminId) {
  const record = await Attendance.findById(attendanceId);
  if (!record) throw new AttendanceError('Attendance record not found', 404, 'NOT_FOUND');

  const previousValue = record.toObject();
  Object.assign(record, updates);
  await record.save();

  await AuditLog.create({
    adminId,
    action: 'UPDATE_ATTENDANCE',
    entity: 'Attendance',
    entityId: attendanceId,
    previousValue,
    newValue: record.toObject(),
  });

  return record;
}

module.exports = {
  AttendanceError,
  identifyEmployeeFromImage,
  checkIn,
  checkOut,
  listAttendance,
  adminUpdateAttendance,
  formatTime,
};
