const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const env = require('../config/environment');
const { success, failure } = require('../utils/response');
const {
  createChallenge,
  verifyChallenge,
} = require('../utils/twoFactorChallenge');

// FR-001: Admin Authentication.
// async function login(req, res, next) {
//   try {
//     const { email, password } = req.body;
//     const admin = await Admin.findOne({ email }).select('+passwordHash');

//     if (!admin || admin.status !== 'active') {
//       return failure(res, 401, 'Invalid credentials');
//     }

//     const valid = await bcrypt.compare(password, admin.passwordHash);
//     if (!valid) {
//       return failure(res, 401, 'Invalid credentials');
//     }

//     const token = jwt.sign({ id: admin._id, role: admin.role }, env.jwtSecret, {
//       expiresIn: env.jwtExpiresIn,
//     });

//     return success(res, 200, 'Login successful', {
//       token,
//       admin: { id: admin._id, name: admin.name, role: admin.role },
//     });
//   } catch (err) {
//     next(err);
//   }
// }
//new admin auth login function with 2FA
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+passwordHash');

    if (!admin || admin.status !== 'active') {
      return failure(res, 401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);

    if (!valid) {
      return failure(res, 401, 'Invalid credentials');
    }

    // If admin has 2FA enabled, do not issue the final JWT yet.
    if (admin.twoFactor?.enabled) {
      // const challengeToken = createChallenge(admin);
      const challengeToken = createChallenge(admin, 'admin');

      return success(res, 200, 'Two-factor authentication required', {
        requiresTwoFactor: true,
        challengeToken,
        admin: {
          id: admin._id,
          name: admin.name,
          role: admin.role,
        },
      });
    }

    // Existing password-only login flow remains unchanged
    // for admins who have not enabled 2FA.
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
      }
    );

    return success(res, 200, 'Login successful', {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

//new update again 
async function setupTwoFactor(req, res, next) {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin || admin.status !== 'active') {
      return failure(res, 401, 'Account is not authorized');
    }

    if (admin.twoFactor?.enabled) {
      return failure(res, 400, 'Two-factor authentication is already enabled');
    }

    const { createTotpSetup, encryptSecret } = require('../services/twoFactorService');
    const QRCode = require('qrcode');

    const { secret, uri } = createTotpSetup(admin.email);

    const pendingSecret = encryptSecret(secret);

    admin.twoFactor.pendingSecret = pendingSecret;
    admin.twoFactor.pendingExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await admin.save();

    const qrCode = await QRCode.toDataURL(uri);

    return success(res, 200, 'Two-factor setup started', {
      qrCode,
      expiresAt: admin.twoFactor.pendingExpiresAt,
    });
  } catch (err) {
    next(err);
  }
}
//new update for verifying 2FA code and completing setup
async function verifyTwoFactorSetup(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return failure(res, 400, 'Authenticator code is required');
    }

    const admin = await Admin.findById(req.admin.id);

    if (!admin || admin.status !== 'active') {
      return failure(res, 401, 'Account is not authorized');
    }

    if (admin.twoFactor?.enabled) {
      return failure(res, 400, 'Two-factor authentication is already enabled');
    }

    if (
      !admin.twoFactor?.pendingSecret ||
      !admin.twoFactor?.pendingExpiresAt
    ) {
      return failure(res, 400, 'No active two-factor setup found');
    }

    if (new Date() > admin.twoFactor.pendingExpiresAt) {
      admin.twoFactor.pendingSecret = null;
      admin.twoFactor.pendingExpiresAt = null;
      await admin.save();

      return failure(res, 400, 'Two-factor setup has expired. Please start again');
    }

    const {
      decryptSecret,
      verifyTotp,
      generateRecoveryCodes,
      hashRecoveryCodes,
    } = require('../services/twoFactorService');

    const secret = decryptSecret(admin.twoFactor.pendingSecret);

    const valid = await verifyTotp(secret, token);

    if (!valid) {
      return failure(res, 401, 'Invalid authenticator code');
    }

    const recoveryCodes = generateRecoveryCodes();
    const recoveryCodeHashes = await hashRecoveryCodes(recoveryCodes);

    admin.twoFactor.enabled = true;
    admin.twoFactor.secret = admin.twoFactor.pendingSecret;
    admin.twoFactor.pendingSecret = null;
    admin.twoFactor.pendingExpiresAt = null;
    admin.twoFactor.enabledAt = new Date();
    admin.twoFactor.recoveryCodes = recoveryCodeHashes.map((codeHash) => ({
      codeHash,
      usedAt: null,
    }));

    await admin.save();

    return success(res, 200, 'Two-factor authentication enabled', {
      recoveryCodes,
    });
  } catch (err) {
    next(err);
  }
}

//verify 2fa login
async function verifyTwoFactorLogin(req, res, next) {
  try {
    const { challengeToken, token } = req.body;

    if (!challengeToken || !token) {
      return failure(res, 400, 'Two-factor code is required');
    }

    let challenge;

    try {
      challenge = verifyChallenge(challengeToken,'admin');
    } catch (error) {
      return failure(res, 401, 'Invalid or expired two-factor challenge');
    }

    const admin = await Admin.findOne({
      _id: challenge.id,
      status: 'active',
    });

    if (
      !admin ||
      !admin.twoFactor?.enabled ||
      !admin.twoFactor?.secret
    ) {
      return failure(res, 401, 'Invalid two-factor challenge');
    }

    const {
      decryptSecret,
      verifyTotp,
    } = require('../services/twoFactorService');

    const secret = decryptSecret(admin.twoFactor.secret);

    const valid = await verifyTotp(secret, token);

    if (!valid) {
      return failure(res, 401, 'Invalid authenticator code');
    }

    const finalToken = jwt.sign(
      {
        id: admin._id.toString(),
        role: admin.role,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
      }
    );

    return success(res, 200, 'Login successful', {
      token: finalToken,
      admin: {
        id: admin._id,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}


async function verifyTwoFactorRecovery(req, res, next) {
  try {
    const { challengeToken, recoveryCode } = req.body;

    if (!challengeToken || !recoveryCode) {
      return failure(res, 400, 'Recovery code is required');
    }

    let challenge;

    try {
      challenge = verifyChallenge(challengeToken);
    } catch (error) {
      return failure(
        res,
        401,
        'Invalid or expired two-factor challenge'
      );
    }

    const admin = await Admin.findOne({
      _id: challenge.id,
      status: 'active',
    });

    if (
      !admin ||
      !admin.twoFactor?.enabled ||
      !admin.twoFactor?.recoveryCodes?.length
    ) {
      return failure(
        res,
        401,
        'Invalid recovery code'
      );
    }

    const {
      hashRecoveryCode,
    } = require('../services/twoFactorService');

    const normalizedCode = recoveryCode
      .replace(/[\s-]/g, '')
      .toUpperCase();

    const codeHash = await hashRecoveryCode(normalizedCode);

    const recoveryCodeEntry =
      admin.twoFactor.recoveryCodes.find(
        (entry) =>
          entry.codeHash === codeHash &&
          !entry.usedAt
      );

    if (!recoveryCodeEntry) {
      return failure(
        res,
        401,
        'Invalid or already used recovery code'
      );
    }

    recoveryCodeEntry.usedAt = new Date();

    await admin.save();

    const finalToken = jwt.sign(
      {
        id: admin._id.toString(),
        role: admin.role,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn,
      }
    );

    return success(res, 200, 'Login successful', {
      token: finalToken,
      admin: {
        id: admin._id,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

//new update for automatically reflecting the 2fa on off status
async function getTwoFactorStatus(req, res, next) {
  try {
    const admin = await Admin.findOne({
      _id: req.admin.id,
      status: 'active',
    });

    if (!admin) {
      return failure(res, 404, 'Admin not found');
    }

    return success(res, 200, 'Two-factor status retrieved', {
      enabled: Boolean(admin.twoFactor?.enabled),
    });
  } catch (error) {
    next(error);
  }
}


//new update for option to disable 2FA
async function disableTwoFactor(req, res, next) {
  try {
    const { password, token } = req.body;

    if (!password || !token) {
      return failure(
        res,
        400,
        'Password and authenticator code are required'
      );
    }

    const admin = await Admin.findOne({
      _id: req.admin.id,
      status: 'active',
    }).select('+passwordHash');

    if (!admin) {
      return failure(res, 404, 'Admin not found');
    }

    if (!admin.twoFactor?.enabled || !admin.twoFactor?.secret) {
      return failure(res, 400, 'Two-factor authentication is not enabled');
    }

    const passwordValid = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordValid) {
      return failure(res, 401, 'Invalid password');
    }

    const {
      decryptSecret,
      verifyTotp,
    } = require('../services/twoFactorService');

    const secret = decryptSecret(admin.twoFactor.secret);

    const tokenValid = await verifyTotp(secret, token);

    if (!tokenValid) {
      return failure(res, 401, 'Invalid authenticator code');
    }

    admin.twoFactor.enabled = false;
    admin.twoFactor.secret = null;
    admin.twoFactor.pendingSecret = null;
    admin.twoFactor.pendingExpiresAt = null;
    admin.twoFactor.recoveryCodes = [];
    admin.twoFactor.enabledAt = null;

    await admin.save();

    return success(res, 200, 'Two-factor authentication disabled');
  } catch (error) {
    next(error);
  }
}

// Convenience endpoint used once during setup to create the first admin.
// In production this should be disabled or protected after initial setup.
async function registerFirstAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await Admin.countDocuments();
    if (existing > 0) {
      return failure(res, 403, 'An admin already exists. Use the dashboard to add more admins.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ name, email, passwordHash, role: 'super_admin' });
    return success(res, 201, 'Initial admin created', { admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    next(err);
  }
}

// module.exports = { login, registerFirstAdmin };
//new update for module export by adding setupTwoFactor
module.exports = {
  login,
  setupTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactorLogin,
  verifyTwoFactorRecovery,
  getTwoFactorStatus,
   disableTwoFactor,
  registerFirstAdmin,
};