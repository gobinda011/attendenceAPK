import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function Security() {
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState(null);

  const [enabled, setEnabled] = useState(false);

  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      setLoading(true);
      setError('');

      const { data } = await client.get('/auth/2fa/status');

      setEnabled(Boolean(data.enabled));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load 2FA status'
      );
    } finally {
      setLoading(false);
    }
  }

  async function startSetup() {
    try {
      setLoading(true);
      setError('');

      const { data } = await client.post('/auth/2fa/setup');

      setSetup(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to start 2FA setup'
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifySetup(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const { data } = await client.post(
        '/auth/2fa/setup/verify',
        { token }
      );

      setRecoveryCodes(data.recoveryCodes);
      setSetup(null);
      setToken('');
      setEnabled(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid authenticator code'
      );
    } finally {
      setLoading(false);
    }
  }

  async function disableTwoFactor(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      await client.post('/auth/2fa/disable', {
        password: disablePassword,
        token: disableToken,
      });

      setEnabled(false);
      setShowDisable(false);
      setDisablePassword('');
      setDisableToken('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to disable two-factor authentication'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading && !setup && !recoveryCodes) {
    return (
      <div>
        <h1>Security</h1>
        <p>Loading security settings...</p>
      </div>
    );
  }

  if (recoveryCodes) {
    return (
      <div>
        <h1>Security</h1>

        <h2>Two-factor authentication enabled</h2>

        <p>
          Save these recovery codes somewhere secure.
          Each code can be used only once.
        </p>

        <ul>
          {recoveryCodes.map((code) => (
            <li key={code}>
              <code>{code}</code>
            </li>
          ))}
        </ul>

        <p>
          These recovery codes will not be shown again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>2FA</h1>

      {/*<p>Two-factor authentication settings</p>*/}

      {enabled && !setup ? (
        <div>
          <h2>Two-factor authentication is enabled</h2>

          <p>
            Your admin account is protected with an
            authenticator app.
          </p>

          <p>
            You will need a 6-digit authenticator code
            every time you sign in.
          </p>

          {!showDisable && (
            <button
              type="button"
              onClick={() => {
                setShowDisable(true);
                setError('');
              }}
            >
              Disable 2FA
            </button>
          )}

          {showDisable && (
            <form
              onSubmit={disableTwoFactor}
              style={{ marginTop: 20 }}
            >
              <h3>Disable two-factor authentication</h3>

              <p>
                Enter your admin password and current
                authenticator code to disable 2FA.
              </p>

              <div className="field">
                <label>Admin password</label>

                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) =>
                    setDisablePassword(e.target.value)
                  }
                  required
                />
              </div>

              <div className="field">
                <label>Authenticator code</label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableToken}
                  onChange={(e) =>
                    setDisableToken(
                      e.target.value.replace(/\D/g, '')
                    )
                  }
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading || disableToken.length !== 6
                }
              >
                {loading
                  ? 'Disabling…'
                  : 'Confirm Disable 2FA'}
              </button>

              <button
                type="button"
                style={{ marginLeft: 10 }}
                onClick={() => {
                  setShowDisable(false);
                  setDisablePassword('');
                  setDisableToken('');
                  setError('');
                }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          {!setup && (
            <div>
              <p>
                Two-factor authentication is currently
                disabled.
              </p>

              <button
                type="button"
                onClick={startSetup}
                disabled={loading}
              >
                {loading ? 'Starting setup…' : 'Enable 2FA'}
              </button>
            </div>
          )}

          {setup && (
            <div>
              <h2>Set up your authenticator</h2>

              <p>
                Scan this QR code using Aegis, Google
                Authenticator, or another compatible
                authenticator app.
              </p>

              <img
                src={setup.qrCode}
                alt="Two-factor authentication QR code"
                style={{
                  width: 220,
                  height: 220,
                }}
              />

              <form onSubmit={verifySetup}>
                <p>
                  Enter the 6-digit code from your
                  authenticator:
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={token}
                  onChange={(e) =>
                    setToken(
                      e.target.value.replace(/\D/g, '')
                    )
                  }
                  required
                />

                <button
                  type="submit"
                  disabled={
                    loading || token.length !== 6
                  }
                >
                  {loading
                    ? 'Verifying…'
                    : 'Verify and Enable 2FA'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}