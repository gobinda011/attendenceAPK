// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import client from '../api/client';

// // FR-002 / Section 4.1 / 23: Employee list with search + add.
// export default function Employees() {
//   const [employees, setEmployees] = useState([]);
//   const [search, setSearch] = useState('');
//   const [showForm, setShowForm] = useState(false);
//   const [form, setForm] = useState({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '' });
//   const [error, setError] = useState('');
//   const [actionError, setActionError] = useState('');

//   async function load() {
//     const { data } = await client.get('/employees', { params: { search } });
//     setEmployees(data.employees);
//   }

//   useEffect(() => { load(); }, [search]);

//   // async function handleCreate(e) {
//   //   e.preventDefault();
//   //   setError('');
//   //   try {
//   //     await client.post('/employees', form);
//   //     setShowForm(false);
//   //     setForm({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '' });
//   //     load();
//   //   } catch (err) {
//   //     setError(err.response?.data?.message || 'Could not create employee');
//   //   }
//   // }
//   async function createEmployee(payload) {
//   const {
//     loginEnabled = true,
//     ...employeeData
//   } = payload;

//   const authentication = {
//     loginEnabled: Boolean(loginEnabled),
//     mustChangePassword: Boolean(loginEnabled),
//     lastLoginAt: null,
//     passwordHash: null,
//   };

//   let temporaryPassword = null;

//   if (loginEnabled) {
//     // Generate a temporary password on the server.
//     temporaryPassword = require('crypto')
//       .randomBytes(9)
//       .toString('base64url');

//     authentication.passwordHash = await bcrypt.hash(
//       temporaryPassword,
//       12
//     );
//   }

//   const employee = await Employee.create({
//     ...employeeData,
//     authentication,
//   });

//   const result = employee.toObject();

//   // Never expose the password hash.
//   if (result.authentication) {
//     delete result.authentication.passwordHash;
//   }

//   return {
//     employee: result,
//     temporaryPassword,
//   };
// }

//   async function handleDeactivate(id) {
//     if (!confirm(`Deactivate employee ${id}? This preserves their attendance history.`)) return;
//     setActionError('');
//     try {
//       await client.delete(`/employees/${id}`);
//       load();
//     } catch (err) {
//       setActionError(err.response?.data?.message || 'Could not deactivate employee');
//     }
//   }

//   async function handleActivate(id) {
//     if (!confirm(`Activate employee ${id}? They will be eligible for face recognition and attendance.`)) return;
//     setActionError('');
//     try {
//       await client.put(`/employees/${id}`, { status: 'active' });
//       load();
//     } catch (err) {
//       setActionError(err.response?.data?.message || 'Could not activate employee');
//     }
//   }

//   return (
//     <div>
//       <div className="page-header">
//         <div>
//           <h1>Employees</h1>
//           <p className="sub">Manage employee profiles and face registration</p>
//         </div>
//         <button className="btn" onClick={() => setShowForm((s) => !s)}>
//           {showForm ? 'Cancel' : '+ Add employee'}
//         </button>
//       </div>

//       {showForm && (
//         <form className="panel" onSubmit={handleCreate}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
//             <div className="field">
//               <label>Employee ID</label>
//               <input required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
//             </div>
//             <div className="field">
//               <label>Full name</label>
//               <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
//             </div>
//             <div className="field">
//               <label>Department</label>
//               <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
//             </div>
//             <div className="field">
//               <label>Designation</label>
//               <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
//             </div>
//             <div className="field">
//               <label>Email</label>
//               <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
//             </div>
//             <div className="field">
//               <label>Phone</label>
//               <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98765 43210" />
//             </div>
//           </div>
//           <button className="btn" type="submit">Create employee</button>
//           {error && <p className="error-text">{error}</p>}
//         </form>
//       )}

//       <div className="panel">
//         <input
//           placeholder="Search by name, ID, or email…"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           style={{ marginBottom: 16, width: 280 }}
//         />
//         {actionError && <p className="error-text">{actionError}</p>}
//         <table>
//           <thead>
//             <tr>
//               <th>ID</th><th>Name</th><th>Department</th><th>Face registered</th><th>Status</th><th></th>
//             </tr>
//           </thead>
//           <tbody>
//             {employees.map((emp) => (
//               <tr key={emp.employeeId}>
//                 <td>{emp.employeeId}</td>
//                 <td><Link to={`/employees/${emp.employeeId}`}>{emp.name}</Link></td>
//                 <td>{emp.department || '—'}</td>
//                 <td>{emp.faceRegistered ? '✓ Registered' : '— Not registered'}</td>
//                 <td><span className={`badge ${emp.status === 'active' ? 'present' : 'absent'}`}>{emp.status}</span></td>
//                 <td>
//                   <Link to={`/employees/${emp.employeeId}/register-face`} className="btn secondary" style={{ marginRight: 6 }}>
//                     Register face
//                   </Link>
//                   {emp.status === 'active' ? (
//                     <button className="btn danger" onClick={() => handleDeactivate(emp.employeeId)}>Deactivate</button>
//                   ) : (
//                     <button className="btn" onClick={() => handleActivate(emp.employeeId)}>Activate</button>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

// FR-002 / Section 4.1 / 23: Employee list with search + add.
export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [resetCredentials, setResetCredentials] = useState(null);
  const [loginCredentials, setLoginCredentials] = useState(null);
const [enablingLoginEmployeeId, setEnablingLoginEmployeeId] = useState(null);
const [resettingEmployeeId, setResettingEmployeeId] = useState(null);
const [disablingLoginEmployeeId, setDisablingLoginEmployeeId] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    department: '',
    designation: '',
    email: '',
    phone: '',
    loginEnabled: true,
  });

  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [creating, setCreating] = useState(false);

  const [createdCredentials, setCreatedCredentials] = useState(null);

  async function load() {
    const { data } = await client.get('/employees', {
      params: { search },
    });

    setEmployees(data.employees);
  }

  useEffect(() => {
    load();
  }, [search]);

  async function handleCreate(e) {
    e.preventDefault();

    setError('');
    setCreatedCredentials(null);
    setCreating(true);

    try {
      const { data } = await client.post('/employees', form);

      setCreatedCredentials({
        employee: data.employee,
        temporaryPassword: data.temporaryPassword,
      });

      setShowForm(false);

      setForm({
        employeeId: '',
        name: '',
        department: '',
        designation: '',
        email: '',
        phone: '',
        loginEnabled: true,
      });

      await load();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not create employee'
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleResetPassword(employeeId) {
  if (
    !confirm(
      `Reset the password for employee ${employeeId}? A new temporary password will be generated.`
    )
  ) {
    return;
  }

  setActionError('');
  setResetCredentials(null);
  setResettingEmployeeId(employeeId);

  try {
    const { data } = await client.post(
      `/employees/${employeeId}/reset-password`
    );

    setResetCredentials({
      employeeId,
      temporaryPassword: data.temporaryPassword,
    });
  } catch (err) {
    setActionError(
      err.response?.data?.message ||
        'Could not reset employee password'
    );
  } finally {
    setResettingEmployeeId(null);
  }
}

async function handleEnableLogin(employeeId) {
  if (
    !confirm(
      `Enable Employee App login for ${employeeId}? A temporary password will be generated.`
    )
  ) {
    return;
  }

  setActionError('');
  setLoginCredentials(null);
  setEnablingLoginEmployeeId(employeeId);

  try {
    const { data } = await client.post(
      `/employees/${employeeId}/enable-login`
    );

    setLoginCredentials({
      employeeId,
      temporaryPassword: data.temporaryPassword,
    });

    await load();
  } catch (err) {
    setActionError(
      err.response?.data?.message ||
        'Could not enable employee app login'
    );
  } finally {
    setEnablingLoginEmployeeId(null);
  }
}


async function handleDisableLogin(employeeId) {
  if (
    !confirm(
      `Disable Employee App login for ${employeeId}? The employee will no longer be able to log into the Employee App.`
    )
  ) {
    return;
  }

  setActionError('');
  setDisablingLoginEmployeeId(employeeId);

  try {
    await client.post(
      `/employees/${employeeId}/disable-login`
    );

    await load();
  } catch (err) {
    setActionError(
      err.response?.data?.message ||
        'Could not disable employee app login'
    );
  } finally {
    setDisablingLoginEmployeeId(null);
  }
}


  async function handleDeactivate(id) {
    if (
      !confirm(
        `Deactivate employee ${id}? This preserves their attendance history.`
      )
    ) {
      return;
    }

    setActionError('');

    try {
      await client.delete(`/employees/${id}`);
      await load();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          'Could not deactivate employee'
      );
    }
  }

  async function handleActivate(id) {
    if (
      !confirm(
        `Activate employee ${id}? They will be eligible for face recognition and attendance.`
      )
    ) {
      return;
    }

    setActionError('');

    try {
      await client.put(`/employees/${id}`, {
        status: 'active',
      });

      await load();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          'Could not activate employee'
      );
    }
  }

  async function copyTemporaryPassword() {
    if (!createdCredentials?.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(
        createdCredentials.temporaryPassword
      );
    } catch {
      // Clipboard may be unavailable in some browsers.
    }
  }


async function copyResetPassword() {
  if (!resetCredentials?.temporaryPassword) return;

  try {
    await navigator.clipboard.writeText(
      resetCredentials.temporaryPassword
    );
  } catch {
    // Clipboard may be unavailable in some browsers.
  }
}


  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="sub">
            Manage employee profiles and face registration
          </p>
        </div>

        <button
          className="btn"
          onClick={() => {
            setShowForm((s) => !s);
            setCreatedCredentials(null);
            setError('');
          }}
        >
          {showForm ? 'Cancel' : '+ Add employee'}
        </button>
      </div>

      {/* One-time credential display */}
      {createdCredentials && (
        <div className="panel">
          <h3 style={{ marginBottom: 8 }}>
            Employee created successfully
          </h3>

          <p style={{ marginBottom: 12 }}>
            Give these temporary login credentials to the employee.
            The temporary password will not be shown again.
          </p>

          <div
            style={{
              display: 'grid',
              gap: 10,
              maxWidth: 500,
            }}
          >
            <div className="field">
              <label>Employee ID</label>
              <input
                value={
                  createdCredentials.employee.employeeId
                }
                readOnly
              />
            </div>

            {createdCredentials.temporaryPassword && (
              <div className="field">
                <label>Temporary password</label>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <input
                    value={
                      createdCredentials.temporaryPassword
                    }
                    readOnly
                  />

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={copyTemporaryPassword}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {createdCredentials.temporaryPassword && (
            <p
              style={{
                marginTop: 12,
                color: 'var(--text-muted)',
              }}
            >
              The employee must change this password on their
              first login.
            </p>
          )}

          <button
            type="button"
            className="btn"
            style={{ marginTop: 12 }}
            onClick={() => setCreatedCredentials(null)}
          >
            Close
          </button>
        </div>
      )}

{/* Password reset result */}
{resetCredentials && (
  <div className="panel">
    <h3 style={{ marginBottom: 8 }}>
      Employee password reset successfully
    </h3>

    <p style={{ marginBottom: 12 }}>
      Give this temporary password to the employee.
      It will not be shown again after you close this message.
    </p>

    <div
      style={{
        display: 'grid',
        gap: 10,
        maxWidth: 500,
      }}
    >
      <div className="field">
        <label>Employee ID</label>
        <input
          value={resetCredentials.employeeId}
          readOnly
        />
      </div>

      <div className="field">
        <label>Temporary password</label>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            value={resetCredentials.temporaryPassword}
            readOnly
          />

          <button
            type="button"
            className="btn secondary"
            onClick={copyResetPassword}
          >
            Copy
          </button>
        </div>
      </div>
    </div>

    <p
      style={{
        marginTop: 12,
        color: 'var(--text-muted)',
      }}
    >
      The employee must change this password at their next login.
    </p>

    <button
      type="button"
      className="btn"
      style={{ marginTop: 12 }}
      onClick={() => setResetCredentials(null)}
    >
      Close
    </button>
  </div>
)}

{/* Employee App login credentials */}
{loginCredentials && (
  <div className="panel">
    <h3 style={{ marginBottom: 8 }}>
      Employee App login enabled
    </h3>

    <p style={{ marginBottom: 12 }}>
      Give this temporary password to the employee.
      It will not be shown again after you close this message.
    </p>

    <div
      style={{
        display: 'grid',
        gap: 10,
        maxWidth: 500,
      }}
    >
      <div className="field">
        <label>Employee ID</label>

        <input
          value={loginCredentials.employeeId}
          readOnly
        />
      </div>

      <div className="field">
        <label>Temporary password</label>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            value={loginCredentials.temporaryPassword}
            readOnly
          />

          <button
            type="button"
            className="btn secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  loginCredentials.temporaryPassword
                );
              } catch {
                // Clipboard may be unavailable in some browsers.
              }
            }}
          >
            Copy
          </button>
        </div>
      </div>
    </div>

    <p
      style={{
        marginTop: 12,
        color: 'var(--text-muted)',
      }}
    >
      The employee must change this password on their first
      Employee App login.
    </p>

    <button
      type="button"
      className="btn"
      style={{ marginTop: 12 }}
      onClick={() => setLoginCredentials(null)}
    >
      Close
    </button>
  </div>
)}

      {/* Add employee form */}
      {showForm && (
        <form className="panel" onSubmit={handleCreate}>
          <h3 style={{ marginBottom: 14 }}>
            Employee details
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div className="field">
              <label>Employee ID</label>

              <input
                required
                value={form.employeeId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    employeeId: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label>Full name</label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label>Department</label>

              <input
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label>Designation</label>

              <input
                value={form.designation}
                onChange={(e) =>
                  setForm({
                    ...form,
                    designation: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label>Email</label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label>Phone</label>

              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>

          {/* Employee App Access */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: 18,
              marginBottom: 18,
            }}
          >
            <h3 style={{ marginBottom: 8 }}>
              Employee App Access
            </h3>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.loginEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    loginEnabled: e.target.checked,
                  })
                }
              />

              <span>
                Enable employee app login
              </span>
            </label>

            <p
              style={{
                marginTop: 8,
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              A secure temporary password will be generated
              automatically when the employee account is created.
            </p>
          </div>

          <button
            className="btn"
            type="submit"
            disabled={creating}
          >
            {creating
              ? 'Creating employee…'
              : 'Create employee'}
          </button>

          {error && (
            <p className="error-text">
              {error}
            </p>
          )}
        </form>
      )}

      <div className="panel">
        <input
          placeholder="Search by name, ID, or email…"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            marginBottom: 16,
            width: 280,
          }}
        />

        {actionError && (
          <p className="error-text">
            {actionError}
          </p>
        )}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Face registered</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => (
              <tr key={emp.employeeId}>
                <td>{emp.employeeId}</td>

                <td>
                  <Link
                    to={`/employees/${emp.employeeId}`}
                  >
                    {emp.name}
                  </Link>
                </td>

                <td>
                  {emp.department || '—'}
                </td>

                <td>
                  {emp.faceRegistered
                    ? '✓ Registered'
                    : '— Not registered'}
                </td>

                <td>
                  <span
                    className={`badge ${
                      emp.status === 'active'
                        ? 'present'
                        : 'absent'
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>

                <td>
                  <Link
                    to={`/employees/${emp.employeeId}/register-face`}
                    className="btn secondary"
                    style={{ marginRight: 6 }}
                  >
                    Register face
                  </Link>


                  {/* <button
  className="btn secondary"
  style={{ marginRight: 6 }}
  disabled={resettingEmployeeId === emp.employeeId}
  onClick={() =>
    handleResetPassword(emp.employeeId)
  }
>
  {resettingEmployeeId === emp.employeeId
    ? 'Resetting…'
    : 'Reset password'}
</button> */}
{emp.authentication?.loginEnabled ? (
  <>
    <button
      className="btn secondary"
      style={{ marginRight: 6 }}
      disabled={resettingEmployeeId === emp.employeeId}
      onClick={() =>
        handleResetPassword(emp.employeeId)
      }
    >
      {resettingEmployeeId === emp.employeeId
        ? 'Resetting…'
        : 'Reset password'}
    </button>

    <button
      className="btn danger"
      style={{ marginRight: 6 }}
      disabled={
        disablingLoginEmployeeId === emp.employeeId
      }
      onClick={() =>
        handleDisableLogin(emp.employeeId)
      }
    >
      {disablingLoginEmployeeId === emp.employeeId
        ? 'Disabling…'
        : 'Disable App Login'}
    </button>
  </>
) : (
  <button
    className="btn secondary"
    style={{ marginRight: 6 }}
    disabled={
      enablingLoginEmployeeId === emp.employeeId
    }
    onClick={() =>
      handleEnableLogin(emp.employeeId)
    }
  >
    {enablingLoginEmployeeId === emp.employeeId
      ? 'Enabling…'
      : 'Create / Enable Login'}
  </button>
)}

                  {emp.status === 'active' ? (
                    <button
                      className="btn danger"
                      onClick={() =>
                        handleDeactivate(
                          emp.employeeId
                        )
                      }
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className="btn"
                      onClick={() =>
                        handleActivate(
                          emp.employeeId
                        )
                      }
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
