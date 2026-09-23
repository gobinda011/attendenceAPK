// Centralized environment configuration.
// Every other module reads config from here instead of process.env directly,
// so defaults and validation live in exactly one place.
require('dotenv').config();

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/attendance_system'),

  jwtSecret: required('JWT_SECRET', 'dev_secret_change_me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  faceServiceUrl: process.env.FACE_SERVICE_URL || 'http://127.0.0.1:8000',
  faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.80'),

  // new update 
  totpEncryptionKey: required('TOTP_ENCRYPTION_KEY'),

  uploadMaxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '5', 10),

  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim()),
};
