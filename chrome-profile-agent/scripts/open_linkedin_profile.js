const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

async function main() {
  const mainUserDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  const tempProfileDir = path.join(os.homedir(), '.chrome-playwright-profile');

  console.log('Preparing Chrome profile session...');

  const defaultProfile = path.join(mainUserDataDir, 'Default');
  const targetDefault = path.join(tempProfileDir, 'Default');

  execSync(`mkdir -p "${targetDefault}"`);
  const itemsToCopy = ['Cookies', 'Network', 'Local Storage', 'Web Data', 'Preferences', 'Login Data'];
  for (const item of itemsToCopy) {
    const src = path.join(defaultProfile, item);
    const dest = path.join(targetDefault, item);
    try {
      execSync(`cp -R "${src}" "${dest}" 2>/dev/null || true`);
    } catch (e) {}
  }

  const context = await chromium.launchPersistentContext(tempProfileDir, {
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    viewport: null,
    ignoreDefaultArgs: [
      '--no-sandbox',
      '--disable-extensions',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-component-extensions-with-background-pages'
    ]
  });

  // Reuse existing default page created by launchPersistentContext (prevents duplicate windows)
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://www.linkedin.com');

  console.log(`Page URL: ${page.url()}`);
  console.log(`Page Title: ${await page.title()}`);
}

main().catch(console.error);
