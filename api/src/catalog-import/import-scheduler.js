// Programa la importación diaria (HU-20) y, si falla, la reintenta cada hora (PA-20-03).

const ONE_HOUR_MS = 60 * 60 * 1000;

function createImportScheduler({
  runImport,
  dailyHour,
  retryDelayMs = ONE_HOUR_MS,
  now = () => new Date(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  logger = console,
}) {
  let timer = null;

  function msUntilNextDailyRun() {
    const current = now();
    const next = new Date(current);
    next.setHours(dailyHour, 0, 0, 0);
    if (next <= current) next.setDate(next.getDate() + 1);
    return next.getTime() - current.getTime();
  }

  function schedule(delayMs) {
    timer = setTimer(tick, delayMs);
  }

  async function tick() {
    let result;
    try {
      result = await runImport();
    } catch (error) {
      logger.error(`Error inesperado en la importación: ${error.message}`);
      result = { status: 'failed' };
    }
    if (result.status === 'success') {
      schedule(msUntilNextDailyRun());
    } else {
      logger.warn('La importación se reintentará dentro de una hora');
      schedule(retryDelayMs);
    }
  }

  function start({ runNow = false } = {}) {
    schedule(runNow ? 0 : msUntilNextDailyRun());
  }

  function stop() {
    clearTimer(timer);
    timer = null;
  }

  return { start, stop, msUntilNextDailyRun };
}

module.exports = { createImportScheduler, ONE_HOUR_MS };
