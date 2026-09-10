const reportService = require('../services/reportService');
const { success } = require('../utils/response');

async function attendanceReport(req, res, next) {
  try {
    const { startDate, endDate, employeeId, format } = req.query;
    const rows = await reportService.buildAttendanceReport({ startDate, endDate, employeeId });

    if (format === 'csv') {
      const csv = reportService.toCsv(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
      return res.status(200).send(csv);
    }

    return success(res, 200, 'Report generated', { rows });
  } catch (err) { next(err); }
}

module.exports = { attendanceReport };
