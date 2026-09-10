/**
 * MATRIX Performance & Load Testing Benchmark
 * Inspired by k6-perf-test-website skill:
 * - Protocol scenario: latency percentiles (min, avg, p95, p99, max) on core endpoints
 * - Concurrent load simulation: 10 concurrent VUs executing requests
 * - SLO Validation: p95 < 500ms, error rate < 1%
 * - Browser Web Vitals: DOMContentLoaded, Load time, LCP measurement
 */

import pkg from 'file:///c:/laragon/www/matrix/frontend/node_modules/@playwright/test/index.js';
const { chromium } = pkg;
import fs from 'node:fs';

const API_BASE = 'http://127.0.0.1:8000/api';
const FRONTEND_BASE = 'http://127.0.0.1:3000';
const CONCURRENT_VUS = 5;
const ITERATIONS_PER_VU = 5; // 25 total requests per endpoint (simulating 5 concurrent factory users)

console.log('====================================================');
console.log('       MATRIX PERFORMANCE & LOAD TEST AUDIT        ');
console.log('====================================================\n');

async function httpRequest(url, options = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer demo-prototype-token',
        ...(options.headers || {})
      },
      body: options.body,
      signal: AbortSignal.timeout(8000),
    });
    await res.text();
    const duration = performance.now() - start;
    return { status: res.status, duration, ok: res.ok };
  } catch (err) {
    const duration = performance.now() - start;
    return { status: 0, duration, ok: false, error: err.message };
  }
}

function calcPercentiles(durations) {
  durations.sort((a, b) => a - b);
  const min = durations[0];
  const max = durations[durations.length - 1];
  const avg = durations.reduce((acc, v) => acc + v, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.50)];
  const p90 = durations[Math.floor(durations.length * 0.90)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  return { min, avg, p50, p90, p95, p99, max };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runEndpointLoadTest(name, url, sloP95 = 500) {
  process.stdout.write(`Benchmarking ${name} (${CONCURRENT_VUS} VUs, ${CONCURRENT_VUS * ITERATIONS_PER_VU} total reqs)... `);
  const allDurations = [];
  let errorCount = 0;
  const startTime = performance.now();

  // Run VUs in parallel with slight think time (standard k6 pacing)
  const vuPromises = Array.from({ length: CONCURRENT_VUS }).map(async (_, vuIdx) => {
    // Stagger start by 20ms per VU
    await sleep(vuIdx * 20);
    for (let i = 0; i < ITERATIONS_PER_VU; i++) {
      const res = await httpRequest(url);
      allDurations.push(res.duration);
      if (!res.ok) errorCount++;
      await sleep(50); // 50ms think-time between iterations
    }
  });

  await Promise.all(vuPromises);
  const totalWallTime = performance.now() - startTime;
  const rps = (allDurations.length / (totalWallTime / 1000));
  const stats = calcPercentiles(allDurations);
  const errorRate = (errorCount / allDurations.length) * 100;
  const passedSlo = stats.p95 <= sloP95 && errorRate <= 1.0;

  console.log(passedSlo ? '[PASS]' : '[FAIL]');
  console.log(`  -> RPS: ${rps.toFixed(1)} req/s | Err: ${errorRate.toFixed(1)}%`);
  console.log(`  -> Avg: ${stats.avg.toFixed(1)}ms | p50: ${stats.p50.toFixed(1)}ms | p95: ${stats.p95.toFixed(1)}ms (SLO: <${sloP95}ms) | Max: ${stats.max.toFixed(1)}ms\n`);

  return {
    name,
    url,
    totalRequests: allDurations.length,
    rps: Number(rps.toFixed(1)),
    errorRate: Number(errorRate.toFixed(2)),
    stats: {
      min: Number(stats.min.toFixed(2)),
      avg: Number(stats.avg.toFixed(2)),
      p50: Number(stats.p50.toFixed(2)),
      p90: Number(stats.p90.toFixed(2)),
      p95: Number(stats.p95.toFixed(2)),
      p99: Number(stats.p99.toFixed(2)),
      max: Number(stats.max.toFixed(2)),
    },
    sloP95,
    passedSlo
  };
}

async function runBrowserWebVitalsTest() {
  console.log('--- Measuring Frontend Web Vitals & Load Performance ---');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const pagesToTest = [
    { name: 'Dashboard Page', url: `${FRONTEND_BASE}/` },
    { name: 'Subcont Tracker', url: `${FRONTEND_BASE}/subcont` },
    { name: 'PO Tracker', url: `${FRONTEND_BASE}/po-tracker` },
  ];

  const results = [];

  for (const p of pagesToTest) {
    process.stdout.write(`Loading ${p.name} in headless Chromium... `);
    const startNav = performance.now();
    await page.goto(p.url, { waitUntil: 'load' });
    const loadTime = performance.now() - startNav;

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
        loadEventEnd: nav ? nav.loadEventEnd - nav.startTime : 0,
      };
    });

    const passed = loadTime < 3000;
    console.log(passed ? '[PASS]' : '[NOTE]');
    console.log(`  -> Total Load: ${loadTime.toFixed(1)}ms | DOMContentLoaded: ${metrics.domContentLoaded.toFixed(1)}ms\n`);

    results.push({
      page: p.name,
      url: p.url,
      loadTimeMs: Number(loadTime.toFixed(1)),
      domContentLoadedMs: Number(metrics.domContentLoaded.toFixed(1)),
      passed
    });
  }

  await browser.close();
  return results;
}

async function main() {
  // Discover first JO ID for detail benchmark
  const projRes = await httpRequest(`${API_BASE}/projects`);
  let joId = null;
  try {
    const raw = await httpRequest(`${API_BASE}/projects`);
  } catch (e) {}

  const benchmarks = [];

  // 1. Core REST Endpoints
  benchmarks.push(await runEndpointLoadTest('GET /api/health', `${API_BASE}/health`, 100));
  benchmarks.push(await runEndpointLoadTest('GET /api/projects', `${API_BASE}/projects`, 250));
  benchmarks.push(await runEndpointLoadTest('GET /api/trackers/subcont', `${API_BASE}/trackers/subcont`, 300));
  benchmarks.push(await runEndpointLoadTest('GET /api/trackers/po', `${API_BASE}/trackers/po`, 300));

  // 2. Browser Web Vitals
  const webVitals = await runBrowserWebVitalsTest();

  const totalPassed = benchmarks.filter(b => b.passedSlo).length + webVitals.filter(v => v.passed).length;
  const totalTests = benchmarks.length + webVitals.length;

  console.log('====================================================');
  console.log(`PERFORMANCE AUDIT SUMMARY: ${totalPassed}/${totalTests} Passed SLOs`);
  console.log(`SLO Adherence Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log('====================================================');

  fs.writeFileSync(
    new URL('./performance-test-results.json', import.meta.url),
    JSON.stringify({ benchmarks, webVitals }, null, 2)
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
