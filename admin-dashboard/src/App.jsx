import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import FaceRegistration from './pages/FaceRegistration.jsx';
import Attendance from './pages/Attendance.jsx';

import Security from './pages/Security.jsx';

function RequireAuth({ children }) {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="employees/:id/register-face" element={<FaceRegistration />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="security" element={<Security />} />//new update for security page
      </Route>
    </Routes>
  );
}
