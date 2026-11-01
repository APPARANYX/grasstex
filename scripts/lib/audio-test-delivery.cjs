'use strict';
// Test-host delivery guard only. Real responses are forwarded unchanged; HTTP
// errors are never retried or replaced. Playback remains owned by the page.
module.exports = function audioTestDelivery(limit, wait = ms => new Promise(r => setTimeout(r, ms))) {
  let active = 0;
  const queued = [];
  const idleWaiters = [];
  const stats = { limit, peak: 0, requests: 0, retries: 0, failures: [] };
  async function handle(route) {
    if (active < limit) active++;
    else await new Promise(resolve => queued.push(resolve));
    stats.peak = Math.max(stats.peak, active);
    stats.requests++;
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await route.fetch({ timeout: 90000, maxRedirects: 5 });
          await route.fulfill({ response });
          break;
        } catch (error) {
          if (attempt >= 2 || !/ERR_CONNECTION_REFUSED|ECONNREFUSED/i.test(String(error))) throw error;
          stats.retries++;
          await wait(300 * (attempt + 1));
        }
      }
    } catch (error) {
      stats.failures.push({ url: route.request().url(), error: String(error) });
      await route.abort('failed');
    } finally {
      if (queued.length) queued.shift()();
      else active--;
      if (!active && !queued.length) while (idleWaiters.length) idleWaiters.shift()();
    }
  }
  function idle() {
    return active || queued.length ? new Promise(resolve => idleWaiters.push(resolve)) : Promise.resolve();
  }
  return { handle, stats, idle };
};
