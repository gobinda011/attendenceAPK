const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/environment');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const employeeAuthRoutes = require('./routes/employeeAuthRoutes');
const employeeAttendanceRoutes = require('./routes/employeeAttendanceRoutes');

const app = express();

// --- Security middleware (Section 7: Non-Functional Requirements) ---
app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins.includes('*') ? true : env.allowedOrigins,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Rate limiting: applied globally, and tighter on the face-capture endpoints
// which are the most sensitive / most expensive to process.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
const attendanceLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
app.use('/api/attendance/check-in', attendanceLimiter);
app.use('/api/attendance/check-out', attendanceLimiter);
app.use('/api/attendance/verify', attendanceLimiter);

// --- Routes ---
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'attendance-backend' }));
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/employee-auth', employeeAuthRoutes);
app.use('/api/employee-attendance', employeeAttendanceRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorMiddleware);

async function start() {
  await connectDatabase();
  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`Backend listening on http://0.0.0.0:${env.port}`);
    logger.info(`AI face service expected at ${env.faceServiceUrl}`);
  });
}

start();

module.exports = app;
