// Minimal structured logger. Swap for winston/pino in production if desired;
// the rest of the app only depends on info/warn/error existing.
const timestamp = () => new Date().toISOString();

module.exports = {
  info: (msg) => console.log(`[INFO]  ${timestamp()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN]  ${timestamp()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${timestamp()} - ${msg}`),
};
