---
name: playwright-browserstack
description: >
  Run Playwright tests on the BrowserStack infrastructure for cross-browser
  and cross-platform compatibility testing. Supports running tests on
  multiple browser versions and operating systems, parallel testing,
  and testing privately hosted websites via BrowserStack Local.
  Use when the user asks to test browser compatibility, run cross-browser
  tests, test on multiple OS/browser combinations, or validate that
  an app works across different environments.
license: MIT
metadata:
  author: BrowserStack
  version: "latest"
  source: https://github.com/browserstack/playwright-browserstack
---

# playwright-browserstack — Compatibility Testing Skill

Sample Playwright tests to run on BrowserStack for cross-browser and cross-platform compatibility testing.

## Introduction

You can run your Playwright tests on the BrowserStack infrastructure. Porting your existing Playwright tests to run on BrowserStack can be done in a matter of minutes.

This guide walks you through running a sample Playwright test on BrowserStack, running tests on privately hosted websites, and running cross-browser tests in parallel.

## Pre-requisites

You need BrowserStack credentials to be able to run Playwright tests. Replace `YOUR_USERNAME` and `YOUR_ACCESS_KEY` in the sample scripts with your BrowserStack credentials from your [Account Settings](https://www.browserstack.com/accounts/settings).

**Alternatively, set the environment variables:**

```bash
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_access_key
```

## Run Your First Playwright Test on BrowserStack

1. Clone the repository
2. Install the dependencies using `npm install`
3. Run the sample script using `node single_test.js`

**Framework directories:**
- Playwright Test Runner: `cd playwright-test`
- Java: `cd playwright-java`
- Python: `cd playwright-python`
- C#: `cd playwright-csharp`

> **Important Note**: Pass your locally installed client Playwright version in the capability `client.playwrightVersion`. This avoids mismatches between your local version and the server version on BrowserStack that could lead to socket errors.

## Run Cross-Browser Tests in Parallel

1. Clone this repository
2. Install the dependencies using `npm install`
3. Run the `parallel_test.js` script using `node parallel_test.js`

## Run Tests on Privately Hosted Websites

1. Download the BrowserStack Local binary:
   - [OS X (10.7+)](https://www.browserstack.com/browserstack-local/BrowserStackLocal-darwin-x64.zip)
   - [Linux 32-bit](https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-ia32.zip)
   - [Linux 64-bit](https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip)
   - [Windows (XP+)](https://www.browserstack.com/browserstack-local/BrowserStackLocal-win32.zip)
2. Unzip and start the BrowserStack Local binary
3. Run your tests with the local capability enabled

## Key Capabilities

| Capability | Description |
|------------|-------------|
| `browser` | Browser to test on (chromium, firefox, webkit) |
| `browser_version` | Specific browser version |
| `os` | Operating system |
| `os_version` | OS version |
| `name` | Test name for BrowserStack dashboard |
| `build` | Build name for grouping tests |
| `client.playwrightVersion` | Your local Playwright version |
| `browserstack.local` | Enable testing of privately hosted sites |

## Useful Links

- [BrowserStack Documentation](https://www.browserstack.com/docs)
- [BrowserStack Playwright Docs](https://www.browserstack.com/docs/automate/playwright)
- [Account Settings](https://www.browserstack.com/accounts/settings)
