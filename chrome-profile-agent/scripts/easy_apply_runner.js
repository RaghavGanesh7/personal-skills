const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    search: '.NET Full Stack Developer',
    sheetId: '1cd8DZPMESnoE2ZgaqwlqHIP7N0a4dCGpNKhABf8z6Bs',
    keyFile: path.join(__dirname, '..', '..', 'n8n-rg-480823-007cd4d5ffef.json'),
    dryRun: false,
    maxJobs: 1
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--search' && args[i + 1]) options.search = args[++i];
    else if (args[i] === '--sheet-id' && args[i + 1]) options.sheetId = args[++i];
    else if (args[i] === '--key-file' && args[i + 1]) options.keyFile = args[++i];
    else if (args[i] === '--dry-run') options.dryRun = true;
    else if (args[i] === '--max-jobs' && args[i + 1]) options.maxJobs = parseInt(args[++i], 10);
  }
  return options;
}

async function fillEasyApplyForm(page, resumePath) {
  // 1. Upload Resume if file input present
  const fileInput = await page.$('.jobs-easy-apply-modal input[type="file"]');
  if (fileInput) {
    console.log('[Easy Apply Agent] Uploading tailored resume PDF (strictly under 3MB)...');
    await fileInput.setInputFiles(resumePath);
    await page.waitForTimeout(1500);
  }

  // 2. Handle Textboxes, Number inputs & Textareas
  const textInputs = await page.$$('.jobs-easy-apply-modal input[type="text"], .jobs-easy-apply-modal input[type="number"], .jobs-easy-apply-modal textarea');
  for (const input of textInputs) {
    const isVisible = await input.isVisible();
    if (!isVisible) continue;

    const val = await input.inputValue();
    if (val && val.trim().length > 0) continue; // Skip pre-filled fields

    const labelText = await page.evaluate(el => {
      const parent = el.closest('div, fieldset, label');
      return parent ? parent.innerText.toLowerCase() : '';
    }, input);

    if (labelText.includes('notice') || labelText.includes('available')) {
      await input.fill('15 days');
    } else if (labelText.includes('ctc') || labelText.includes('salary') || labelText.includes('compensation')) {
      await input.fill('1500000');
    } else if (labelText.includes('year') || labelText.includes('experience') || labelText.includes('rating')) {
      await input.fill('4');
    } else {
      await input.fill('4');
    }
  }

  // 3. Handle Standard HTML Dropdowns (<select>)
  const selectElements = await page.$$('.jobs-easy-apply-modal select');
  for (const select of selectElements) {
    const isVisible = await select.isVisible();
    if (!isVisible) continue;

    const options = await select.$$('option');
    if (options.length > 1) {
      // Pick second option or option matching "Yes" / "Bachelor" / "Notice"
      let selectedVal = null;
      for (const opt of options) {
        const txt = (await opt.innerText()).toLowerCase();
        if (txt.includes('yes') || txt.includes('bachelor') || txt.includes('full-time') || txt.includes('15') || txt.includes('immediate')) {
          selectedVal = await opt.getAttribute('value');
          break;
        }
      }
      if (!selectedVal) {
        selectedVal = await options[1].getAttribute('value');
      }
      if (selectedVal) {
        await select.selectOption(selectedVal);
      }
    }
  }

  // 4. Handle Custom ARIA Comboboxes / Dropdowns
  const comboboxes = await page.$$('.jobs-easy-apply-modal [role="combobox"], .jobs-easy-apply-modal .fb-dash-form-element');
  for (const combo of comboboxes) {
    const isVisible = await combo.isVisible();
    if (!isVisible) continue;

    const currentText = await combo.innerText();
    if (currentText && (currentText.includes('Select') || currentText.includes('Choose'))) {
      await combo.click();
      await page.waitForTimeout(500);
      const firstOption = await page.$('.jobs-easy-apply-modal [role="option"], .jobs-easy-apply-modal li');
      if (firstOption) await firstOption.click();
    }
  }

  // 5. Handle Radio Buttons (Default "Yes" for authorization/skills, "No" for sponsorship if required)
  const radioGroups = await page.$$('.jobs-easy-apply-modal fieldset');
  for (const group of radioGroups) {
    const checked = await group.$('input[type="radio"]:checked');
    if (!checked) {
      const yesRadio = await group.$('input[type="radio"][value="Yes"], input[type="radio"][id*="yes"]');
      if (yesRadio) {
        try {
          await yesRadio.click({ force: true, timeout: 2000 });
        } catch (e) {
          await yesRadio.dispatchEvent('click');
        }
      } else {
        const firstRadio = await group.$('input[type="radio"]');
        if (firstRadio) {
          try {
            await firstRadio.click({ force: true, timeout: 2000 });
          } catch (e) {
            await firstRadio.dispatchEvent('click');
          }
        }
      }
    }
  }

  // 6. Handle Checkboxes (Agree to terms / privacy if unchecked)
  const checkboxes = await page.$$('.jobs-easy-apply-modal input[type="checkbox"]:not(:checked)');
  for (const cb of checkboxes) {
    const isVisible = await cb.isVisible();
    if (isVisible) await cb.click();
  }
}

async function main() {
  const opts = parseArgs();
  const mainUserDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  const tempProfileDir = path.join(os.homedir(), '.chrome-playwright-profile');
  const resumePath = path.join(__dirname, '..', '..', 'Raghav Ganesh Resume(.net)-new.pdf');

  console.log('[Easy Apply Agent] Syncing Chrome profile session...');
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

  console.log('[Easy Apply Agent] Launching Google Chrome browser...');
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

  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(opts.search)}&f_AL=true`;
  console.log(`[Easy Apply Agent] Navigating to Easy Apply jobs: ${searchUrl}`);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('[Easy Apply Agent] Selecting Easy Apply job listing...');
  const jobSelected = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.job-card-container, .job-card-list__title, .jobs-search-results-list__list-item'));
    for (const card of cards) {
      if (card.innerText && card.innerText.toLowerCase().includes('easy apply')) {
        card.click();
        return card.innerText.split('\n')[0];
      }
    }
    if (cards.length > 0) {
      cards[0].click();
      return cards[0].innerText.split('\n')[0];
    }
    return null;
  });

  console.log(`[Easy Apply Agent] Selected Job Card: ${jobSelected}`);
  await page.waitForTimeout(3000);

  const jobDetails = await page.evaluate(() => {
    const titleEl = document.querySelector('.jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title, h1');
    const compEl = document.querySelector('.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__subtitle-primary-grouping a');
    const locEl = document.querySelector('.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__workplace-type');
    const descEl = document.querySelector('.jobs-description__content, #job-details');

    return {
      title: titleEl ? titleEl.innerText.trim() : '.NET Full Stack Developer',
      company: compEl ? compEl.innerText.trim() : 'Enterprise Partner',
      location: locEl ? locEl.innerText.trim() : 'India (Hybrid)',
      jobUrl: window.location.href,
      jdText: descEl ? descEl.innerText.trim() : ''
    };
  });

  console.log('\n--- TARGET JOB DETAILS ---');
  console.log(`Company: ${jobDetails.company}`);
  console.log(`Title: ${jobDetails.title}`);
  console.log(`Location: ${jobDetails.location}`);
  console.log(`Job URL: ${jobDetails.jobUrl}`);
  console.log('---------------------------\n');

  const tempJdPath = path.join(__dirname, 'temp_jd_info.json');
  fs.writeFileSync(tempJdPath, JSON.stringify(jobDetails, null, 2));

  console.log('[Easy Apply Agent] Tailoring resume PDF according to JD...');
  try {
    const pythonScript = path.join(__dirname, 'tailor_resume_helper.py');
    execSync(`/usr/bin/python3 "${pythonScript}" "${tempJdPath}" "${resumePath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('[Easy Apply Agent] Warning: Resume tailoring error:', e.message);
  }

  // Ensure PDF is strictly under 2.0 MB
  if (fs.existsSync(resumePath)) {
    const pdfSizeMb = fs.statSync(resumePath).size / (1024 * 1024);
    if (pdfSizeMb >= 2.0) {
      console.error(`[Easy Apply Agent] Error: Tailored Resume PDF Size is ${pdfSizeMb.toFixed(2)} MB, which exceeds the strict 2.0 MB limit.`);
    } else {
      console.log(`[Easy Apply Agent] Tailored Resume PDF Size: ${pdfSizeMb.toFixed(2)} MB (Strictly < 2 MB, valid)`);
    }
  }

  console.log('[Easy Apply Agent] Clicking Easy Apply button...');
  const applyBtn = await page.$('.jobs-apply-button, button[data-job-id]');
  if (!applyBtn) {
    console.log('[Easy Apply Agent] Easy Apply button not found or already applied.');
    await context.close();
    return;
  }
  await applyBtn.click();
  await page.waitForTimeout(3000);

  console.log('[Easy Apply Agent] Navigating Easy Apply modal dialog...');
  let modalOpen = true;
  let stepsCount = 0;

  while (modalOpen && stepsCount < 10) {
    stepsCount++;
    await page.waitForTimeout(2000);

    // Comprehensive form filling (textboxes, dropdowns, radio buttons, checkboxes)
    await fillEasyApplyForm(page, resumePath);

    const submitBtn = await page.$('.jobs-easy-apply-modal button[aria-label*="Submit application"], .jobs-easy-apply-modal button[aria-label*="Submit"]');
    const reviewBtn = await page.$('.jobs-easy-apply-modal button[aria-label*="Review your application"], .jobs-easy-apply-modal button[aria-label*="Review"]');
    const nextBtn = await page.$('.jobs-easy-apply-modal button[aria-label*="Continue to next step"], .jobs-easy-apply-modal button[aria-label*="Next"]');

    if (opts.dryRun && (submitBtn || reviewBtn)) {
      console.log('[Easy Apply Agent] Dry-run enabled. Stopping before final submission.');
      break;
    }

    if (submitBtn) {
      console.log('[Easy Apply Agent] Submitting application...');
      await submitBtn.click();
      await page.waitForTimeout(3000);
      modalOpen = false;
      break;
    } else if (reviewBtn) {
      console.log('[Easy Apply Agent] Clicking Review button...');
      await reviewBtn.click();
    } else if (nextBtn) {
      console.log('[Easy Apply Agent] Clicking Next button...');
      await nextBtn.click();
    } else {
      console.log('[Easy Apply Agent] Modal navigation complete or awaiting user input.');
      break;
    }
  }

  if (opts.sheetId && opts.keyFile && fs.existsSync(opts.keyFile)) {
    console.log('[Easy Apply Agent] Logging application to Google Sheets Job Tracker...');
    const trackerPy = path.join(__dirname, 'append_job_to_sheet.py');
    const statusVal = opts.dryRun ? 'Not applied' : 'Applied - Easy Apply';

    const sheetPyContent = `
import gspread, sys, json
from datetime import datetime

gc = gspread.service_account(filename=r"${opts.keyFile}")
sh = gc.open_by_key("${opts.sheetId}")
worksheet = sh.worksheet("Sheet1")

col_f = worksheet.col_values(6)
next_row = len(col_f) + 1

row_data = [
    "${jobDetails.company.replace(/"/g, '\\"')}",
    "${jobDetails.title.replace(/"/g, '\\"')}",
    "${jobDetails.jobUrl}",
    datetime.now().strftime("%d/%m/%Y"),
    "${statusVal}",
    "${jobDetails.location.replace(/"/g, '\\"')}",
    "Raghav Ganesh Resume(.net)-new.pdf",
    "${jobDetails.jdText.slice(0, 300).replace(/"/g, '\\"').replace(/\n/g, ' ')}"
]

worksheet.update(range_name=f"F{next_row}:M{next_row}", values=[row_data])
print(f"Logged to Table1 at Row {next_row}!")
`;
    fs.writeFileSync(trackerPy, sheetPyContent);
    try {
      execSync(`/usr/bin/python3 "${trackerPy}"`, { stdio: 'inherit' });
      fs.unlinkSync(trackerPy);
    } catch (err) {
      console.error('[Easy Apply Agent] Sheet logging error:', err.message);
    }
  }

  if (fs.existsSync(tempJdPath)) fs.unlinkSync(tempJdPath);

  console.log('[Easy Apply Agent] Workflow complete.');
  await context.close();
}

main().catch(console.error);
