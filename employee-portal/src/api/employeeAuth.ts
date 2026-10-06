import client from './client';

export async function loginEmployee(
  employeeId: string,
  password: string
) {
  const response = await client.post('/employee-auth/login', {
    employeeId,
    password,
  });

  return response.data;
}

export async function changeEmployeePassword(
  employeeId: string,
  currentPassword: string,
  newPassword: string
) {
  const response = await client.post(
    '/employee-auth/change-password',
    {
      employeeId,
      currentPassword,
      newPassword,
    }
  );

  return response.data;
}


export async function getEmployeeProfile() {
  const response = await client.get('/employee-auth/me');
  return response.data;
}

export async function getTwoFactorStatus() {
  const response = await client.get(
    '/employee-auth/2fa/status'
  );

  return response.data;
}

export async function setupTwoFactor() {
  const response = await client.post(
    '/employee-auth/2fa/setup'
  );

  return response.data;
}

export async function verifyTwoFactorSetup(
  token: string
) {
  const response = await client.post(
    '/employee-auth/2fa/setup/verify',
    {
      token,
    }
  );

  return response.data;
}

export async function disableTwoFactor(
  password: string,
  token: string
) {
  const response = await client.post(
    '/employee-auth/2fa/disable',
    {
      password,
      token,
    }
  );

  return response.data;
}

export async function verifyTwoFactorLogin(
  challengeToken: string,
  token: string
) {
  const response = await client.post(
    '/employee-auth/2fa/verify',
    {
      challengeToken,
      token,
    }
  );

  return response.data;
}

export async function verifyTwoFactorRecovery(
  challengeToken: string,
  recoveryCode: string
) {
  const response = await client.post(
    '/employee-auth/2fa/recovery',
    {
      challengeToken,
      recoveryCode,
    }
  );

  return response.data;
}