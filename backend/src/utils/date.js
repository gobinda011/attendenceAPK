const dayjs = require('dayjs');

// All attendance records are keyed by calendar day (YYYY-MM-DD), not by
// timestamp, so check-in/check-out for the same day always collide correctly
// regardless of what time each request arrives.
function todayKey() {
  return dayjs().format('YYYY-MM-DD');
}

function dateKey(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function formatTime(date) {
  return dayjs(date).format('hh:mm A');
}

module.exports = { todayKey, dateKey, formatTime };
