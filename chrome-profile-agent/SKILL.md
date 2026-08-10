---
name: chrome-profile-agent
description: Drive active Google Chrome sessions and user profiles using Playwright MCP on macOS. Automate browser tasks, filter & submit LinkedIn Easy Apply jobs, tailor PDF resumes to JDs (under 3MB), and log job applications to Google Sheets.
metadata:
  version: 1.3.0
  author: Raghav Ganesh
  license: MIT
  tags:
    - browser-automation
    - playwright
    - chrome-profile
    - linkedin-easy-apply
    - resume-tailoring
    - google-sheets
---

# Playwright Chrome Profile Agent

The **Chrome Profile Agent** connects Google Antigravity to your active Google Chrome profile on macOS using **Playwright MCP** (`@playwright/mcp`). It allows AI agents to interact with logged-in web applications (LinkedIn, GitHub, Google Workspaces) without requiring re-authentication.

---

## Agent Instructions & Rules

### 1. Resume File Size Limit Rule
- **Strict Requirement**: The tailored PDF resume (`Raghav Ganesh Resume(.net)-new.pdf`) MUST stay **strictly under 3 MB** (target size: `~2.0 MB`).
- **Enforcement**: PyMuPDF script `tailor_resume_helper.py` saves with `deflate=True, garbage=4, clean=True` to compress streams and strip orphaned font objects.

### 2. Comprehensive Easy Apply Form Filling Rules
When navigating LinkedIn Easy Apply modal dialogs (`.jobs-easy-apply-modal`), the agent MUST systematically check and fill:
- **Resume Upload**: Attach `Raghav Ganesh Resume(.net)-new.pdf` (< 3MB).
- **Textboxes & Number Inputs**:
  - Years of Experience / Skill ratings: Default to `4` years.
  - Notice Period fields: Fill `15 days` or `Immediate`.
  - Compensation / CTC fields: Fill expected CTC values.
- **Dropdowns & Comboboxes**:
  - Native `<select>` elements: Inspect `<option>` list and choose matching choice ("Yes", "Bachelor's", "Full-time", "15 days").
  - ARIA comboboxes (`[role="combobox"]`): Click to expand options and select first valid choice.
- **Radio Buttons & Checkboxes**:
  - Work Authorization: Select `Yes`.
  - Sponsorship: Select `No` (or `Yes` if required).
  - Terms / Agreements: Check all mandatory checkboxes.

---

## Operating Modes

### Mode 1: Automated LinkedIn Easy Apply Workflow
Run the end-to-end Easy Apply automation script:

```bash
# 1. Test Easy Apply workflow in dry-run mode (stops before final submission)
node scripts/easy_apply_runner.js --search ".NET Full Stack Developer" --dry-run

# 2. Execute full Easy Apply workflow with auto-submission & Google Sheets logging
node scripts/easy_apply_runner.js --search ".NET Developer"
```

#### Workflow Steps executed by `easy_apply_runner.js`:
1. Navigates to LinkedIn Jobs with `f_AL=true` (Easy Apply filter).
2. Selects an Easy Apply job listing and extracts full Job Description (`jdText`).
3. Executes `tailor_resume_helper.py` to update `Raghav Ganesh Resume(.net)-new.pdf` (strictly < 3MB).
4. Clicks `.jobs-apply-button` to open the Easy Apply modal.
5. Uploads tailored resume PDF, fills textboxes, handles `<select>` dropdowns and ARIA comboboxes, and answers radio buttons.
6. Clicks Next $\rightarrow$ Review $\rightarrow$ Submit application.
7. Logs the submission directly to **Job Tracker - Raghav** (`Table1`, range `F:M`).

---

### Mode 2: CDP Connection (Active Chrome Session)
Attaches directly to your running Google Chrome browser over Chrome Developer Protocol (CDP):

1. **Check CDP Port Status**:
   ```bash
   curl -s http://localhost:9222/json/version
   ```
2. **Launch Chrome with CDP**:
   ```bash
   ./scripts/launch_chrome_cdp.sh
   ```
3. **Run Playwright MCP**:
   ```bash
   npx -y @playwright/mcp --cdp-endpoint http://localhost:9222
   ```

---

### Mode 3: Cloned Profile Session (Co-existence with Open Chrome)
If Chrome is open and cannot be restarted in CDP mode, Playwright syncs session state (`Cookies`, `Web Data`, `Local Storage`, `Preferences`, `Login Data`) to `~/.chrome-playwright-profile` to bypass Chrome's `SingletonLock`:

```bash
node scripts/chrome_runner.js --search ".NET Full Stack Developer"
```

---

## Workflow Guide for AI Agents

When assisting a user with job application tasks:
1. Ensure the tailored PDF size remains < 3 MB.
2. Execute `scripts/easy_apply_runner.js` with `--search` for the requested role.
3. Automatically handle textboxes, select dropdowns, comboboxes, radio buttons, and resume upload.
4. All completed applications will automatically log to **Job Tracker - Raghav** in Google Sheets (`Table1` range `F:M`).
