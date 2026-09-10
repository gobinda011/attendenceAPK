const mongoose = require('mongoose');

// Rule 8: every admin-initiated change to attendance (or other sensitive
// records) must be logged with who did what, and what changed.
const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    action: { type: String, required: true }, // e.g. 'UPDATE_ATTENDANCE', 'DEACTIVATE_EMPLOYEE'
    entity: { type: String, required: true }, // e.g. 'Attendance', 'Employee'
    entityId: { type: String, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
