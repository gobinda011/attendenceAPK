const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true }, // Rule 10: must be unique
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    joiningDate: { type: Date },

    profileImage: { type: String }, // path/URL to optional profile photo

    // --- Biometric fields (Section 3 / 15) ---
    faceRegistered: { type: Boolean, default: false },
    // Embeddings only — raw face images are NOT stored permanently (Section 15).
    faceEmbeddings: [
      {
        vector: { type: [Number], required: true },
        label: { type: String, default: 'primary' }, // e.g. front / left / right
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Rule 9: deletion is modeled as deactivation, not destructive delete,
    // so historical attendance records remain valid and queryable.
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
