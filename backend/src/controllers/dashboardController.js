const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/response');

// Section 34: Dashboard APIs.
async function summary(req, res, next) {
  try {
    const data = await dashboardService.summary();
    return success(res, 200, 'Dashboard summary retrieved', data);
  } catch (err) { next(err); }
}

async function today(req, res, next) {
  try {
    const records = await dashboardService.todaysAttendance();
    return success(res, 200, "Today's attendance retrieved", { records });
  } catch (err) { next(err); }
}

async function monthly(req, res, next) {
  try {
    const { year, month } = req.query;
    const data = await dashboardService.monthly(year, month);
    return success(res, 200, 'Monthly stats retrieved', { data });
  } catch (err) { next(err); }
}

async function department(req, res, next) {
  try {
    const data = await dashboardService.byDepartment();
    return success(res, 200, 'Department stats retrieved', { data });
  } catch (err) { next(err); }
}

module.exports = { summary, today, monthly, department };
