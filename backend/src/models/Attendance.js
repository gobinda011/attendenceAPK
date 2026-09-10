const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    timestamp: { type: Date },
    verificationScore: { type: Number }, // similarity/confidence returned by AI service
    verificationMethod: { type: String, default: 'face_embedding' },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true }, // references Employee.employeeId
    date: { type: String, required: true }, // YYYY-MM-DD calendar key (see utils/date.js)

    checkIn: { type: verificationSchema, default: null },
    checkOut: { type: verificationSchema, default: null },

    status: {
      type: String,
      enum: ['present', 'checked_out', 'absent'],
      default: 'present',
    },
  },
  { timestamps: true }
);

// Section 14 / Rule 5: exactly one attendance record per employee per day.
// This unique compound index is the authoritative, database-level guarantee;
// the application-level "already checked in?" check is the first line of
// defense, this index is the second line that can never be bypassed by a
// race condition or a bug in the controller logic.
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
