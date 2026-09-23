const crypto = require('crypto');
const { generateSecret, generateURI, verify } = require('otplib');

const env = require('../config/environment');
const { encrypt, decrypt } = require('../utils/crypto');

const ISSUER = 'Attendance System';
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;

function createTotpSetup(email) {
  const secret = generateSecret();

  const uri = generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  });

  return {
    secret,
    uri,
  };
}

async function verifyTotp(secret, token) {
  const result = await verify({
    secret,
    token,
  });

  return result.valid;
}

function encryptSecret(secret) {
  return encrypt(secret);
}

function decryptSecret(encryptedSecret) {
  return decrypt(encryptedSecret);
}

function generateRecoveryCodes() {
  const codes = [];

  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    const randomPart = crypto
      .randomBytes(Math.ceil(RECOVERY_CODE_LENGTH / 2))
      .toString('hex')
      .slice(0, RECOVERY_CODE_LENGTH)
      .toUpperCase();

    codes.push(randomPart);
  }

  return codes;
}

async function hashRecoveryCode(code) {
  const hash = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

  return hash;
}

async function hashRecoveryCodes(codes) {
  return Promise.all(codes.map(hashRecoveryCode));
}

async function verifyRecoveryCode(code, storedHash) {
  const hash = await hashRecoveryCode(code);

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

module.exports = {
  createTotpSetup,
  verifyTotp,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyRecoveryCode,
};
