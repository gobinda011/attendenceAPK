// const jwt = require('jsonwebtoken');
// const env = require('../config/environment');

// const CHALLENGE_EXPIRES_IN = '5m';

// function createChallenge(admin) {
//   return jwt.sign(
//     {
//       id: admin._id.toString(),
//       type: '2fa_pending',
//     },
//     env.jwtSecret,
//     {
//       expiresIn: CHALLENGE_EXPIRES_IN,
//     }
//   );
// }

// function verifyChallenge(token) {
//   const payload = jwt.verify(token, env.jwtSecret);

//   if (payload.type !== '2fa_pending') {
//     throw new Error('Invalid 2FA challenge');
//   }

//   return payload;
// }

// module.exports = {
//   createChallenge,
//   verifyChallenge,
// };

const jwt = require('jsonwebtoken');

const env = require('../config/environment');

const CHALLENGE_EXPIRES_IN = '5m';

function createChallenge(account, accountType) {
  if (!account || !account._id) {
    throw new Error('Account is required to create 2FA challenge');
  }

  if (!['admin', 'employee'].includes(accountType)) {
    throw new Error('Invalid 2FA account type');
  }

  return jwt.sign(
    {
      id: account._id.toString(),
      type: '2fa_pending',
      accountType,
    },
    env.jwtSecret,
    {
      expiresIn: CHALLENGE_EXPIRES_IN,
    }
  );
}

function verifyChallenge(token, expectedAccountType) {
  const payload = jwt.verify(token, env.jwtSecret);

  if (payload.type !== '2fa_pending') {
    throw new Error('Invalid 2FA challenge');
  }

  if (
    expectedAccountType &&
    payload.accountType !== expectedAccountType
  ) {
    throw new Error('Invalid 2FA account type');
  }

  return payload;
}

module.exports = {
  createChallenge,
  verifyChallenge,
};