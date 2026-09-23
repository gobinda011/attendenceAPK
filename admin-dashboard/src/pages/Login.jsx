// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import client from '../api/client';

// // FR-001: Admin Authentication.
// export default function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError('');
//     setLoading(true);
//     try {
//       const { data } = await client.post('/auth/login', { email, password });
//       localStorage.setItem('admin_token', data.token);
//       localStorage.setItem('admin_name', data.admin.name);
//       navigate('/dashboard');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="login-shell">
//       <form className="login-card" onSubmit={handleSubmit}>
//         <h1>Admin sign in</h1>
//         <p className="sub">Attendance Management System</p>

//         <div className="field">
//           <label>Email</label>
//           <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
//         </div>
//         <div className="field">
//           <label>Password</label>
//           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
//         </div>

//         <button className="btn" type="submit" style={{ width: '100%' }} disabled={loading}>
//           {loading ? 'Signing in…' : 'Sign in'}
//         </button>

//         {error && <p className="error-text">{error}</p>}
//       </form>
//     </div>
//   );
// }

//new update for the login page to include 2FA challenge
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

// FR-001: Admin Authentication + 2FA.
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [token, setToken] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handlePasswordLogin(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const { data } = await client.post('/auth/login', {
        email,
        password,
      });

      // 2FA is enabled for this admin
      if (data.requiresTwoFactor) {
        setChallengeToken(data.challengeToken);
        setTwoFactorRequired(true);
        return;
      }

      // 2FA is not enabled
      completeLogin(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorLogin(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const { data } = await client.post('/auth/2fa/verify', {
        challengeToken,
        token,
      });

      completeLogin(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Invalid authenticator code'
      );
    } finally {
      setLoading(false);
    }
  }

  function completeLogin(data) {
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_name', data.admin.name);

    navigate('/dashboard');
  }

  // -----------------------------
  // 2FA CODE SCREEN
  // -----------------------------
  if (twoFactorRequired) {
    return (
      <div className="login-shell">
        <form
          className="login-card"
          onSubmit={handleTwoFactorLogin}
        >
          <h1>Two-factor authentication</h1>

          <p className="sub">
            Enter the 6-digit code from your authenticator app.
          </p>

          <div className="field">
            <label>Authenticator code</label>

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
              placeholder="000000"
              autoFocus
              required
            />
          </div>

          <button
            className="btn"
            type="submit"
            style={{ width: '100%' }}
            disabled={loading || token.length !== 6}
          >
            {loading ? 'Verifying…' : 'Verify and sign in'}
          </button>

          {error && (
            <p className="error-text">
              {error}
            </p>
          )}

          <button
            type="button"
            className="btn secondary"
            style={{
              width: '100%',
              marginTop: 10,
            }}
            onClick={() => {
              setTwoFactorRequired(false);
              setChallengeToken('');
              setToken('');
              setError('');
            }}
          >
            Back to login
          </button>
        </form>
      </div>
    );
  }

  // -----------------------------
  // EMAIL + PASSWORD SCREEN
  // -----------------------------
  return (
    <div className="login-shell">
      <form
        className="login-card"
        onSubmit={handlePasswordLogin}
      >
        <h1>Admin sign in</h1>

        <p className="sub">
          Attendance Management System
        </p>

        <div className="field">
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />
        </div>

        <button
          className="btn"
          type="submit"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}