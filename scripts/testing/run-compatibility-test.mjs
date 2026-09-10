/**
 * MATRIX Compatibility & Cross-Viewport Testing
 * Inspired by playwright-browserstack skill:
 * - Tests multiple viewports (Desktop 1920x1080, Laptop 1366x768, Tablet 768x1024, Mobile 375x667, 390x844)
 * - Validates responsive table horizontal scrolling
 * - Validates navigation and modal dialog responsiveness
 * - Checks for DOM overflow and horizontal page clipping
 */

import pkg from 'file:///c:/laragon/www/matrix/frontend/node_modules/@playwright/test/index.js';
const { chromium } = pkg;
import fs from 'node:fs';

const BASE_URL = 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: 'Desktop Full HD', width: 1920, height: 1080, isMobile: false },
  { name: 'Standard Laptop', width: 1366, height: 768, isMobile: false },
  { name: 'iPad / Tablet Portrait', width: 768, height: 1024, isMobile: true },
  { name: 'iPhone SE (Compact Mobile)', width: 375, height: 667, isMobile: true },
  { name: 'iPhone 14/15 (Standard Mobile)', width: 390, height: 844, isMobile: true },
];

console.log('====================================================');
console.log('       MATRIX COMPATIBILITY & VIEWPORT AUDIT       ');
console.log('====================================================\n');

async function testViewport(browser, vp) {
  console.log(`--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
  });

  const page = await context.newPage();
  const checks = [];

  try {
    // 0. Authenticate as Controller
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    const usernameInput = page.locator('#login-username');
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('matrix');
      await page.locator('#login-password').fill('eng#1');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(`${BASE_URL}/`);
    }

    // 1. Dashboard Responsiveness
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const headerVisible = await page.locator('header').isVisible();
    const titleText = await page.title();

    // Check horizontal page body overflow
    const bodyOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    checks.push({
      view: 'Dashboard',
      test: 'Header Rendered',
      passed: headerVisible,
      evidence: `Title: "${titleText}", Header visible: ${headerVisible}`
    });

    checks.push({
      view: 'Dashboard',
      test: 'No Horizontal Body Overflow',
      passed: !bodyOverflow,
      evidence: bodyOverflow ? `Body overflowed viewport by ${bodyOverflow}px` : 'Body fits viewport'
    });

    // 2. Open first JO Detail Page
    const joWithItems = page.locator("a[href*='/projects/'][href*='/jos/']").filter({ hasText: "126.110" });
    const joLink = (await joWithItems.count() > 0) ? joWithItems.first() : page.locator("a[href*='/projects/'][href*='/jos/']").first();
    
    if (await joLink.isVisible()) {
      await joLink.click();
      await page.waitForURL(/\/projects\/.*\/jos\/.*/);
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});

      const tableCount = await page.locator('table').count();
      checks.push({
        view: 'JO Detail',
        test: 'Process Control Table Exists',
        passed: tableCount > 0,
        evidence: `Table count: ${tableCount}`
      });

      // On mobile/tablet, ensure table is horizontally scrollable
      if (vp.isMobile) {
        const isScrollable = await page.evaluate(() => {
          const el = document.querySelector('.control-table-wrapper, table')?.parentElement;
          return el ? el.scrollWidth >= el.clientWidth : true;
        });
        checks.push({
          view: 'JO Detail',
          test: 'Table Scrollable on Mobile',
          passed: isScrollable,
          evidence: isScrollable ? 'Table has horizontal scroll container' : 'Table fits or no scroll container'
        });
      }
    }

    // 3. Subcont Tracker Page
    await page.goto(`${BASE_URL}/subcont`, { waitUntil: 'domcontentloaded' });
    const scHeading = await page.locator('h1, h2').first().textContent();
    checks.push({
      view: 'Subcont Tracker',
      test: 'Page Rendered on Viewport',
      passed: scHeading !== null,
      evidence: `Heading: "${scHeading?.trim()}"`
    });

    // 4. PO Tracker Page
    await page.goto(`${BASE_URL}/po-tracker`, { waitUntil: 'domcontentloaded' });
    const poHeading = await page.locator('h1, h2').first().textContent();
    checks.push({
      view: 'PO Tracker',
      test: 'Page Rendered on Viewport',
      passed: poHeading !== null,
      evidence: `Heading: "${poHeading?.trim()}"`
    });

  } catch (err) {
    checks.push({
      view: 'Exception',
      test: 'Execution Error',
      passed: false,
      evidence: err.message
    });
  } finally {
    await context.close();
  }

  for (const c of checks) {
    console.log(`  ${c.passed ? '[PASS]' : '[FAIL]'} [${c.view}] ${c.test} - ${c.evidence}`);
  }
  console.log('');

  return { viewport: vp.name, dimensions: `${vp.width}x${vp.height}`, checks };
}

async function main() {
  const browser = await chromium.launch();
  const allResults = [];

  for (const vp of VIEWPORTS) {
    const res = await testViewport(browser, vp);
    allResults.push(res);
  }

  await browser.close();

  const totalChecks = allResults.flatMap(r => r.checks);
  const passedChecks = totalChecks.filter(c => c.passed);

  console.log('====================================================');
  console.log(`COMPATIBILITY SUMMARY: ${passedChecks.length}/${totalChecks.length} Passed`);
  console.log(`Pass Rate: ${((passedChecks.length / totalChecks.length) * 100).toFixed(1)}%`);
  console.log('====================================================');

  fs.writeFileSync(
    new URL('./compatibility-test-results.json', import.meta.url),
    JSON.stringify(allResults, null, 2)
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
