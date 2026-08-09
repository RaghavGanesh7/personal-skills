const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

// Simple CLI arg parser
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: 'https://www.linkedin.com/jobs/',
    search: '.NET Full Stack Developer',
    sheetId: null,
    keyFile: null,
    status: 'Not applied',
    keepOpen: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) options.url = args[++i];
    else if (args[i] === '--search' && args[i + 1]) options.search = args[++i];
    else if (args[i] === '--sheet-id' && args[i + 1]) options.sheetId = args[++i];
    else if (args[i] === '--key-file' && args[i + 1]) options.keyFile = args[++i];
    else if (args[i] === '--status' && args[i + 1]) options.status = args[++i];
    else if (args[i] === '--keep-open') options.keepOpen = true;
  }
  return options;
}

async function main() {
  const opts = parseArgs();
  const mainUserDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  const tempProfileDir = path.join(os.homedir(), '.chrome-playwright-profile');

  console.log(`[Chrome Agent] Syncing profile state from ${mainUserDataDir}...`);
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

  console.log('[Chrome Agent] Launching Google Chrome browser instance...');
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

  const page = context.pages()[0] || await context.newPage();

  const targetUrl = opts.search 
    ? `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(opts.search)}`
    : opts.url;

  console.log(`[Chrome Agent] Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log(`[Chrome Agent] Loaded page title: ${await page.title()}`);

  if (opts.keepOpen) {
    console.log('[Chrome Agent] Browser window active. Keeping session open...');
    await new Promise(() => {});
  } else {
    await context.close();
    console.log('[Chrome Agent] Finished task cleanly.');
  }
}

main().catch(console.error);
