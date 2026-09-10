import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

// FR-002 / Section 4.1 / 23: Employee list with search + add.
export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  async function load() {
    const { data } = await client.get('/employees', { params: { search } });
    setEmployees(data.employees);
  }

  useEffect(() => { load(); }, [search]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/employees', form);
      setShowForm(false);
      setForm({ employeeId: '', name: '', department: '', designation: '', email: '', phone: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create employee');
    }
  }

  async function handleDeactivate(id) {
    if (!confirm(`Deactivate employee ${id}? This preserves their attendance history.`)) return;
    setActionError('');
    try {
      await client.delete(`/employees/${id}`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not deactivate employee');
    }
  }

  async function handleActivate(id) {
    if (!confirm(`Activate employee ${id}? They will be eligible for face recognition and attendance.`)) return;
    setActionError('');
    try {
      await client.put(`/employees/${id}`, { status: 'active' });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not activate employee');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="sub">Manage employee profiles and face registration</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add employee'}
        </button>
      </div>

      {showForm && (
        <form className="panel" onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="field">
              <label>Employee ID</label>
              <input required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
            <div className="field">
              <label>Full name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="field">
              <label>Designation</label>
              <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98765 43210" />
            </div>
          </div>
          <button className="btn" type="submit">Create employee</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      <div className="panel">
        <input
          placeholder="Search by name, ID, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16, width: 280 }}
        />
        {actionError && <p className="error-text">{actionError}</p>}
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Department</th><th>Face registered</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.employeeId}>
                <td>{emp.employeeId}</td>
                <td><Link to={`/employees/${emp.employeeId}`}>{emp.name}</Link></td>
                <td>{emp.department || '—'}</td>
                <td>{emp.faceRegistered ? '✓ Registered' : '— Not registered'}</td>
                <td><span className={`badge ${emp.status === 'active' ? 'present' : 'absent'}`}>{emp.status}</span></td>
                <td>
                  <Link to={`/employees/${emp.employeeId}/register-face`} className="btn secondary" style={{ marginRight: 6 }}>
                    Register face
                  </Link>
                  {emp.status === 'active' ? (
                    <button className="btn danger" onClick={() => handleDeactivate(emp.employeeId)}>Deactivate</button>
                  ) : (
                    <button className="btn" onClick={() => handleActivate(emp.employeeId)}>Activate</button>
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
