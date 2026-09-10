import React, { useEffect, useState } from 'react';
import client from '../api/client';

// FR-011: Admin Attendance Management — filter, view, correct.
export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ date: '', employeeId: '' });
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.employeeId) params.employeeId = filters.employeeId;
    const { data } = await client.get('/attendance', { params });
    setRecords(data.records);
  }

  useEffect(() => { load(); }, [filters]);

  async function correctStatus(id, status) {
    await client.put(`/attendance/${id}`, { status });
    setEditingId(null);
    load();
  }

  function exportCsv() {
    const url = `${client.defaults.baseURL}/reports/attendance?format=csv`;
    window.open(url, '_blank');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p className="sub">Filter, review, and correct attendance records</p>
        </div>
        <button className="btn secondary" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="panel" style={{ display: 'flex', gap: 12 }}>
        <div className="field">
          <label>Date</label>
          <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </div>
        <div className="field">
          <label>Employee ID</label>
          <input value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} />
        </div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr><th>Employee</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td>{r.employeeId}</td>
                <td>{r.date}</td>
                <td>{r.checkIn ? new Date(r.checkIn.timestamp).toLocaleTimeString() : '--'}</td>
                <td>{r.checkOut ? new Date(r.checkOut.timestamp).toLocaleTimeString() : '--'}</td>
                <td>
                  {editingId === r._id ? (
                    <select defaultValue={r.status} onChange={(e) => correctStatus(r._id, e.target.value)}>
                      <option value="present">present</option>
                      <option value="checked_out">checked_out</option>
                      <option value="absent">absent</option>
                    </select>
                  ) : (
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  )}
                </td>
                <td>
                  <button className="btn secondary" onClick={() => setEditingId(editingId === r._id ? null : r._id)}>
                    {editingId === r._id ? 'Cancel' : 'Correct'}
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--text-muted)' }}>No records match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
