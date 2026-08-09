const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const mainUserDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  const tempProfileDir = path.join(os.homedir(), '.chrome-playwright-profile');

  console.log('Syncing Chrome profile session...');
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

  console.log('Launching browser to search LinkedIn Jobs...');
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
  
  // Navigate to LinkedIn Jobs search for .NET Full Stack Engineer
  const searchUrl = 'https://www.linkedin.com/jobs/search/?keywords=.NET%20Full%20Stack%20Developer';
  console.log(`Navigating to ${searchUrl}...`);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(4000);

  console.log('Page Title:', await page.title());

  // Extract job card titles and descriptions
  const jobDetails = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.job-card-container, .jobs-search-results-list__list-item, .job-card-list'));
    const results = [];
    
    // Fallback: search for any job title links
    const jobLinks = Array.from(document.querySelectorAll('a[href*="/jobs/view/"]'));
    
    return {
      cardsCount: cards.length,
      linksCount: jobLinks.length,
      firstLinkText: jobLinks[0] ? jobLinks[0].innerText : '',
      firstLinkHref: jobLinks[0] ? jobLinks[0].href : '',
      bodyText: document.body.innerText.slice(0, 3000)
    };
  });

  console.log('Extracted Job Details:', JSON.stringify(jobDetails, null, 2));

  // Write snapshot info to file
  fs.writeFileSync('job_search_results.json', JSON.stringify(jobDetails, null, 2));
  
  // Keep browser context available or close after extraction
  await page.waitForTimeout(3000);
  await context.close();
}

main().catch(console.error);
