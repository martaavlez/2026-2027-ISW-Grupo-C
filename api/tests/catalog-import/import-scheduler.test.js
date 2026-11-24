const { createImportScheduler, ONE_HOUR_MS } = require('../../src/catalog-import/import-scheduler');

const silentLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };

function schedulerWith(runImport, currentTime = '2026-11-24T10:00:00') {
  const timers = [];
  const scheduler = createImportScheduler({
    runImport,
    dailyHour: 3,
    now: () => new Date(currentTime),
    setTimer: (callback, delay) => timers.push({ callback, delay }),
    clearTimer: jest.fn(),
    logger: silentLogger,
  });
  return { scheduler, timers };
}

test('test_msUntilNextDailyRun_afterTheHour_waitsUntilTomorrow', () => {
  const { scheduler } = schedulerWith(jest.fn());

  expect(scheduler.msUntilNextDailyRun()).toBe(17 * ONE_HOUR_MS);
});

test('test_msUntilNextDailyRun_beforeTheHour_runsToday', () => {
  const { scheduler } = schedulerWith(jest.fn(), '2026-11-24T01:00:00');

  expect(scheduler.msUntilNextDailyRun()).toBe(2 * ONE_HOUR_MS);
});

test('test_start_withRunNow_schedulesImmediately', () => {
  const { scheduler, timers } = schedulerWith(jest.fn());

  scheduler.start({ runNow: true });
  scheduler.start();

  expect(timers.map((timer) => timer.delay)).toEqual([0, 17 * ONE_HOUR_MS]);
});

test('test_tick_whenImportSucceeds_schedulesNextDay', async () => {
  const { scheduler, timers } = schedulerWith(jest.fn().mockResolvedValue({ status: 'success' }));

  scheduler.start({ runNow: true });
  await timers[0].callback();

  expect(timers[1].delay).toBe(17 * ONE_HOUR_MS);
});

test('test_tick_whenMusicBrainzIsDown_retriesInOneHour', async () => {
  const { scheduler, timers } = schedulerWith(jest.fn().mockResolvedValue({ status: 'failed' }));

  scheduler.start({ runNow: true });
  await timers[0].callback();

  expect(timers[1].delay).toBe(ONE_HOUR_MS);
});

test('test_tick_whenImportThrows_retriesInOneHour', async () => {
  const { scheduler, timers } = schedulerWith(jest.fn().mockRejectedValue(new Error('db down')));

  scheduler.start({ runNow: true });
  await timers[0].callback();

  expect(timers[1].delay).toBe(ONE_HOUR_MS);
  scheduler.stop();
});
