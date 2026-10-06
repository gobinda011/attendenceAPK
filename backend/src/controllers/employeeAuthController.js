const {
  authenticateEmployee,
  createEmployeeToken,
  changeEmployeePassword,
} = require('../services/employeeAuthService');

const Employee = require('../models/Employee');
const { success, failure } = require('../utils/response');

const {
  createChallenge,
  verifyChallenge,
} = require('../utils/twoFactorChallenge');

const {
  createTotpSetup,
  encryptSecret,
  decryptSecret,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyRecoveryCode,
} = require('../services/twoFactorService');

const QRCode = require('qrcode');
const bcrypt = require('bcrypt');


/*
 * ---------------------------------------------------------
 * EMPLOYEE LOGIN
 * ---------------------------------------------------------
 */

async function login(req, res, next) {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return failure(
        res,
        400,
        'Employee ID and password are required'
      );
    }

    const result = await authenticateEmployee(employeeId, password);

    if (!result.success) {
      return failure(res, 401, result.message);
    }

    const { employee } = result;

    /*
     * First login:
     * The temporary password must be changed before
     * an authenticated employee session is created.
     */
    if (employee.authentication?.mustChangePassword) {
      return success(res, 200, 'Password change required', {
        requiresPasswordChange: true,
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
        },
      });
    }

    /*
     * Employee has enabled TOTP 2FA.
     *
     * Do NOT issue the final JWT yet.
     */
    if (employee.twoFactor?.enabled) {
      const challengeToken = createChallenge(
        employee,
        'employee'
      );

      return success(
        res,
        200,
        'Two-factor authentication required',
        {
          requiresPasswordChange: false,
          requiresTwoFactor: true,
          challengeToken,
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
          },
        }
      );
    }

    /*
     * Employee has no 2FA enabled.
     * Password authentication is sufficient for now.
     */
    const token = createEmployeeToken(employee);

    employee.authentication.lastLoginAt = new Date();
    await employee.save();

    return success(res, 200, 'Login successful', {
      requiresPasswordChange: false,
      requiresTwoFactor: false,
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (err) {
    next(err);
  }
}


/*
 * ---------------------------------------------------------
 * CHANGE PASSWORD
 * ---------------------------------------------------------
 */

async function changePassword(req, res, next) {
  try {
    const {
      employeeId,
      currentPassword,
      newPassword,
    } = req.body;

    if (!employeeId || !currentPassword || !newPassword) {
      return failure(
        res,
        400,
        'Employee ID, current password and new password are required'
      );
    }

    if (newPassword.length < 8) {
      return failure(
        res,
        400,
        'New password must be at least 8 characters long'
      );
    }

    const result = await changeEmployeePassword(
      employeeId,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      return failure(res, 401, result.message);
    }

    return success(
      res,
      200,
      'Password changed successfully'
    );
  } catch (err) {
    next(err);
  }
}


/*
 * ---------------------------------------------------------
 * START EMPLOYEE 2FA SETUP
 * ---------------------------------------------------------
 */

async function setupTwoFactor(req, res, next) {
  try {
    const employee = await Employee.findOne({
      _id: req.employee.id,
      status: 'active',
      'authentication.loginEnabled': true,
    });

    if (!employee) {
      return failure(
        res,
        401,
        'Employee account is not authorized'
      );
    }

    if (employee.twoFactor?.enabled) {
      return failure(
        res,
        400,
        'Two-factor authentication is already enabled'
      );
    }

    /*
     * Use email as the authenticator label when available.
     * Fall back to employee ID if email is not configured.
     */
    const label =
      employee.email || employee.employeeId;

    const {
      secret,
      uri,
    } = createTotpSetup(label);

    const pendingSecret = encryptSecret(secret);

    employee.twoFactor.pendingSecret = pendingSecret;
    employee.twoFactor.pendingExpiresAt =
      new Date(Date.now() + 10 * 60 * 1000);

    await employee.save();

    const qrCode = await QRCode.toDataURL(uri);

    return success(
      res,
      200,
      'Two-factor setup started',
      {
        qrCode,
        expiresAt: employee.twoFactor.pendingExpiresAt,
      }
    );
  } catch (err) {
    next(err);
  }
}


/*
 * ---------------------------------------------------------
 * VERIFY EMPLOYEE 2FA SETUP
 * ---------------------------------------------------------
 */

async function verifyTwoFactorSetup(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return failure(
        res,
        400,
        'Authenticator code is required'
      );
    }

    const employee = await Employee.findOne({
      _id: req.employee.id,
      status: 'active',
      'authentication.loginEnabled': true,
    });

    if (!employee) {
      return failure(
        res,
        401,
        'Employee account is not authorized'
      );
    }

    if (employee.twoFactor?.enabled) {
      return failure(
        res,
        400,
        'Two-factor authentication is already enabled'
      );
    }

    if (
      !employee.twoFactor?.pendingSecret ||
      !employee.twoFactor?.pendingExpiresAt
    ) {
      return failure(
        res,
        400,
        'No active two-factor setup found'
      );
    }

    if (
      new Date() >
      employee.twoFactor.pendingExpiresAt
    ) {
      employee.twoFactor.pendingSecret = null;
      employee.twoFactor.pendingExpiresAt = null;

      await employee.save();

      return failure(
        res,
        400,
        'Two-factor setup has expired. Please start again'
      );
    }

    const secret = decryptSecret(
      employee.twoFactor.pendingSecret
    );

    const valid = await verifyTotp(
      secret,
      token
    );

    if (!valid) {
      return failure(
        res,
        401,
        'Invalid authenticator code'
      );
    }

    /*
     * Generate recovery codes only after the TOTP
     * setup has been successfully verified.
     */
    const recoveryCodes =
      generateRecoveryCodes();

    const recoveryCodeHashes =
      await hashRecoveryCodes(recoveryCodes);

    employee.twoFactor.enabled = true;

    employee.twoFactor.secret =
      employee.twoFactor.pendingSecret;

    employee.twoFactor.pendingSecret = null;
    employee.twoFactor.pendingExpiresAt = null;

    employee.twoFactor.enabledAt = new Date();

    employee.twoFactor.recoveryCodes =
      recoveryCodeHashes.map((codeHash) => ({
        codeHash,
        usedAt: null,
      }));

    await employee.save();

    return success(
      res,
      200,
      'Two-factor authentication enabled',
      {
        recoveryCodes,
      }
    );
  } catch (err) {
    next(err);
  }
}


/*
 * ---------------------------------------------------------
 * VERIFY EMPLOYEE 2FA LOGIN
 * ---------------------------------------------------------
 */

async function verifyTwoFactorLogin(req, res, next) {
  try {
    const {
      challengeToken,
      token,
    } = req.body;

    if (!challengeToken || !token) {
      return failure(
        res,
        400,
        'Two-factor code is required'
      );
    }

    let challenge;

    try {
      challenge = verifyChallenge(
        challengeToken,
        'employee'
      );
    } catch (error) {
      return failure(
        res,
        401,
        'Invalid or expired two-factor challenge'
      );
    }

    const employee = await Employee.findOne({
      _id: challenge.id,
      status: 'active',
      'authentication.loginEnabled': true,
    });

    if (
      !employee ||
      !employee.twoFactor?.enabled ||
      !employee.twoFactor?.secret
    ) {
      return failure(
        res,
        401,
        'Invalid two-factor challenge'
      );
    }

    const secret = decryptSecret(
      employee.twoFactor.secret
    );

    const valid = await verifyTotp(
      secret,
      token
    );

    if (!valid) {
      return failure(
        res,
        401,
        'Invalid authenticator code'
      );
    }

    const finalToken =
      createEmployeeToken(employee,true);

    employee.authentication.lastLoginAt =
      new Date();

    await employee.save();

    return success(
      res,
      200,
      'Login successful',
      {
        token: finalToken,
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          designation: employee.designation,
        },
      }
    );
  } catch (err) {
    next(err);
  }
}


/*
 * ---------------------------------------------------------
 * EMPLOYEE 2FA RECOVERY LOGIN
 * ---------------------------------------------------------
 */

async function verifyTwoFactorRecovery(
  req,
  res,
  next
) {
  try {
    const {
      challengeToken,
      recoveryCode,
    } = req.body;

    if (!challengeToken || !recoveryCode) {
      return failure(
        res,
        400,
        'Recovery code is required'
      );
    }

    let challenge;

    try {
      challenge = verifyChallenge(
        challengeToken,
        'employee'
      );
    } catch (error) {
      return failure(
        res,
        401,
        'Invalid or expired two-factor challenge'
      );
    }

    const employee = await Employee.findOne({
      _id: challenge.id,
      status: 'active',
      'authentication.loginEnabled': true,
    });

    if (
      !employee ||
      !employee.twoFactor?.enabled ||
      !employee.twoFactor?.recoveryCodes?.length
    ) {
      return failure(
        res,
        401,
        'Invalid recovery code'
      );
    }

    const normalizedCode = recoveryCode
      .replace(/[\s-]/g, '')
      .toUpperCase();

    let matchedEntry = null;

    for (
      const entry of employee.twoFactor.recoveryCodes
    ) {
      if (entry.usedAt) {
        continue;
      }

      const valid = await verifyRecoveryCode(
        normalizedCode,
        entry.codeHash
      );

      if (valid) {
        matchedEntry = entry;
        break;
      }
    }

    if (!matchedEntry) {
      return failure(
        res,
        401,
        'Invalid or already used recovery code'
      );
    }

    matchedEntry.usedAt = new Date();

    await employee.save();

    const finalToken =
      createEmployeeToken(employee,true);

    employee.authentication.lastLoginAt =
      new Date();

    await employee.save();

    return success(
      res,
      200,
      'Login successful',
      {
        token: finalToken,
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          designation: employee.designation,
        },
      }
    );
  } catch (err) {
    next(err);
  }
}


/*
 * ---------------------------------------------------------
 * EMPLOYEE 2FA STATUS
 * ---------------------------------------------------------
 */

async function getTwoFactorStatus(
  req,
  res,
  next
) {
  try {
    const employee = await Employee.findOne({
      _id: req.employee.id,
      status: 'active',
    });

    if (!employee) {
      return failure(
        res,
        404,
        'Employee not found'
      );
    }

    return success(
      res,
      200,
      'Two-factor status retrieved',
      {
        enabled: Boolean(
          employee.twoFactor?.enabled
        ),
      }
    );
  } catch (err) {
    next(err);
  }
}


/*
 * ---------------------------------------------------------
 * DISABLE EMPLOYEE 2FA
 * ---------------------------------------------------------
 */

async function disableTwoFactor(
  req,
  res,
  next
) {
  try {
    const {
      password,
      token,
    } = req.body;

    if (!password || !token) {
      return failure(
        res,
        400,
        'Password and authenticator code are required'
      );
    }

    const employee = await Employee.findOne({
      _id: req.employee.id,
      status: 'active',
    }).select(
      '+authentication.passwordHash'
    );

    if (!employee) {
      return failure(
        res,
        404,
        'Employee not found'
      );
    }

    if (
      !employee.twoFactor?.enabled ||
      !employee.twoFactor?.secret
    ) {
      return failure(
        res,
        400,
        'Two-factor authentication is not enabled'
      );
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        employee.authentication.passwordHash
      );

    if (!passwordValid) {
      return failure(
        res,
        401,
        'Invalid password'
      );
    }

    const secret = decryptSecret(
      employee.twoFactor.secret
    );

    const tokenValid =
      await verifyTotp(secret, token);

    if (!tokenValid) {
      return failure(
        res,
        401,
        'Invalid authenticator code'
      );
    }

    employee.twoFactor.enabled = false;
    employee.twoFactor.secret = null;
    employee.twoFactor.pendingSecret = null;
    employee.twoFactor.pendingExpiresAt = null;
    employee.twoFactor.recoveryCodes = [];
    employee.twoFactor.enabledAt = null;

    await employee.save();

    return success(
      res,
      200,
      'Two-factor authentication disabled'
    );
  } catch (err) {
    next(err);
  }
}


async function getProfile(req, res, next) {
  try {
    return success(res, 200, 'Employee profile retrieved', {
      employee: req.employee,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  changePassword,
  setupTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactorLogin,
  verifyTwoFactorRecovery,
  getTwoFactorStatus,
  disableTwoFactor,
  getProfile,
};