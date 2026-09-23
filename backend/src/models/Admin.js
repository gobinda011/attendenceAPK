// const mongoose = require('mongoose');

// const adminSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     passwordHash: { type: String, required: true, select: false },
//     role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
//     status: { type: String, enum: ['active', 'disabled'], default: 'active' },
//   },
//   { timestamps: true } // createdAt / updatedAt
// );

// module.exports = mongoose.model('Admin', adminSchema);

// new update here for 2FA
const mongoose = require('mongoose');

const recoveryCodeSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true },
    usedAt: { type: Date, default: null },
  },
  { _id: false }
);

const twoFactorSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },

    // Encrypted TOTP secret used after 2FA setup is completed.
    secret: { type: String, default: null },

    // Temporary encrypted secret used during enrollment.
    // It becomes the active secret only after the setup code is verified.
    pendingSecret: { type: String, default: null },
    pendingExpiresAt: { type: Date, default: null },

    // Recovery codes are stored as hashes, never plaintext.
    recoveryCodes: {
      type: [recoveryCodeSchema],
      default: [],
    },

    enabledAt: { type: Date, default: null },
  },
  { _id: false }
);

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin',
    },

    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },

    twoFactor: {
      type: twoFactorSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);