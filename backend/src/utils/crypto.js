const crypto = require('crypto');
const env = require('../config/environment');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const key = Buffer.from(env.totpEncryptionKey, 'hex');

  if (key.length !== 32) {
    throw new Error('TOTP_ENCRYPTION_KEY must be a 32-byte hex key');
  }

  return key;
}

function encrypt(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

function decrypt(payload) {
  const key = getEncryptionKey();

  const parts = payload.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted TOTP secret format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = Buffer.from(parts[2], 'hex');

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH
  ) {
    throw new Error('Invalid encrypted TOTP secret');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

module.exports = {
  encrypt,
  decrypt,
};