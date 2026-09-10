---
name: percy-playwright
description: >
  Percy visual testing for Playwright. Captures visual snapshots of web pages
  and compares them against baselines to detect unintended visual changes.
  Use when the user asks to set up visual regression testing, compare UI
  screenshots, detect visual changes between builds, or integrate Percy
  with Playwright test suites.
license: MIT
metadata:
  author: Percy / BrowserStack
  version: "latest"
  source: https://github.com/percy/percy-playwright
---

# @percy/playwright — Interface Visual Testing Skill

[Percy](https://percy.io) visual testing for Playwright.

## Installation

```bash
npm install --save-dev @percy/cli @percy/playwright
```

## Usage

This is an example using the `percySnapshot` function:

```javascript
const { chromium } = require('playwright');
const percySnapshot = require('@percy/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://example.com/', { waitUntil: 'networkidle2' });
  await percySnapshot(page, 'Example Site');

  await browser.close();
})();
```

Running the code above directly will result in the following logs:

```bash
$ node script.js
[percy] Percy is not running, disabling snapshots
```

When running with [`percy exec`](https://github.com/percy/cli/tree/master/packages/cli-exec#percy-exec), and your project's `PERCY_TOKEN`, a new Percy build will be created and snapshots will be uploaded to your project.

```bash
$ export PERCY_TOKEN=[your-project-token]
$ percy exec -- node script.js
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Running "node script.js"
[percy] Snapshot taken "Example Site"
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Configuration

`percySnapshot(page, name[, options])`

- `page` (**required**) - A `playwright` page instance
- `name` (**required**) - The snapshot name; must be unique to each snapshot
- `options` - [See per-snapshot configuration options](https://www.browserstack.com/docs/percy/take-percy-snapshots/overview#per-snapshot-configuration)

## toHaveScreenshot Drop-in

Route your existing Playwright `expect(...).toHaveScreenshot()` assertions through Percy with **one config line and no test changes**:

```js
// playwright.config.js
require('@percy/playwright/dropin'); // registers the toHaveScreenshot override

module.exports = defineConfig({ /* your config */ });
```

```bash
PERCY_TOKEN=<web-project-token> npx percy exec -- npx playwright test
```

| Project | Flow |
|---------|------|
| **Web** | Every `toHaveScreenshot()` becomes a Percy web snapshot: the live page is serialized with the same capture `percySnapshot()` uses and Percy renders it server-side. Locator subjects become element-scoped snapshots. |
| **App** | The captured PNG uploads straight through the comparison ingest — no render flow. |
| anything else | A clear wrong-token configuration error. |

The assertion **always passes locally** — the visual verdict moves to Percy's review UI, and a missing/invalid token or any Percy error **never fails your suite** (the whole run falls back to native `toHaveScreenshot`).

### Baseline Auto-Setup

On a **new (empty) Percy project**, `percy exec` detects this package plus the Playwright baseline PNGs already committed in your repo (`*-snapshots` directories) and establishes the baseline before your tests run:

1. **Build #1** — your committed screenshots are uploaded directly and the build is auto-approved.
2. **Build #2** — your actual command runs and diffs against that baseline immediately.

With no committed screenshots, the first run itself becomes the auto-approved baseline.
