import pkg from 'file:///c:/laragon/www/matrix/frontend/node_modules/@playwright/test/index.js';
const { chromium } = pkg;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://127.0.0.1:3000/login');
  await page.locator('#login-username').fill('matrix');
  await page.locator('#login-password').fill('eng#1');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('http://127.0.0.1:3000/');

  const joLink = page.locator("a[href*='/projects/'][href*='/jos/']").first();
  await joLink.click();
  await page.waitForURL(/\/projects\/.*\/jos\/.*/);

  // Check the first item checkbox
  const itemCheckbox = page.locator("table tbody input[type='checkbox']").first();
  await itemCheckbox.check();

  // Click 'Ubah Status' button
  const bulkStatusBtn = page.getByRole('button', { name: 'Ubah Status' });
  await bulkStatusBtn.click();

  await page.waitForSelector("text='Ubah Status Proses (Bulk)'");

  // Get process checkbox labels inside the grid
  const processLabels = await page.locator("label:has(input[type='checkbox']) span").allTextContents();
  console.log('Bulk Process Options Available:', JSON.stringify(processLabels));

  await browser.close();
}

main().catch(console.error);
