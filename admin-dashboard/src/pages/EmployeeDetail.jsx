import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

// Section 23: Employee Details + attendance history for one employee.
export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', designation: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadEmployee() {
    const r = await client.get(`/employees/${id}`);
    const emp = r.data.employee;
    setEmployee(emp);
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || '',
      designation: emp.designation || '',
    });
  }

  useEffect(() => {
    loadEmployee();
    client.get(`/attendance/employee/${id}`).then((r) => setHistory(r.data.records));
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await client.put(`/employees/${id}`, form);
      await loadEmployee();
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update employee');
    } finally {
      setSaving(false);
    }
  }

  if (!employee) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{employee.name}</h1>
          <p className="sub">{employee.employeeId} · {employee.department || 'No department'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn secondary" onClick={() => setEditing((s) => !s)}>
            {editing ? 'Cancel' : 'Edit profile'}
          </button>
          <Link to={`/employees/${id}/register-face`} className="btn">Register / update face</Link>
        </div>
      </div>

      {editing && (
        <form className="panel" onSubmit={handleSave}>
          <h3 style={{ marginBottom: 14 }}>Edit profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="field">
              <label>Full name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98765 43210" />
            </div>
            <div className="field">
              <label>Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="field">
              <label>Designation</label>
              <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
          </div>
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      <div className="panel">
        <h3 style={{ marginBottom: 10 }}>Profile</h3>
        <p>Email: {employee.email || '—'}</p>
        <p>Phone: {employee.phone || '—'}</p>
        <p>Designation: {employee.designation || '—'}</p>
        <p>Face registered: {employee.faceRegistered ? `Yes (${employee.faceEmbeddings.length} sample(s))` : 'No'}</p>
        <p>Status: <span className={`badge ${employee.status === 'active' ? 'present' : 'absent'}`}>{employee.status}</span></p>
      </div>

      <div className="panel">
        <h3 style={{ marginBottom: 10 }}>Attendance history</h3>
        <table>
          <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead>
          <tbody>
            {history.map((r) => (
              <tr key={r._id}>
                <td>{r.date}</td>
                <td>{r.checkIn ? new Date(r.checkIn.timestamp).toLocaleTimeString() : '--'}</td>
                <td>{r.checkOut ? new Date(r.checkOut.timestamp).toLocaleTimeString() : '--'}</td>
                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
            {history.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>No attendance history yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
