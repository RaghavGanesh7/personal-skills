# Chrome Profile Agent Skill

A custom skill for **Google Antigravity** and MCP-compatible AI coding assistants to automate browser workflows on macOS using your actual Google Chrome profile and Playwright MCP (`@playwright/mcp`).

---

## Features
- **LinkedIn Easy Apply Automation**: Filter jobs by `Easy Apply` (`f_AL=true`), extract JDs, upload tailored resumes, auto-fill screening questions, and submit applications.
- **Dynamic Resume Tailoring**: Automatically updates `Raghav Ganesh Resume(.net)-new.pdf` using PyMuPDF to match JD keywords while maintaining 100% exact visual layout.
- **Google Sheets Job Tracker Sync**: Logs applications directly to **Job Tracker - Raghav** (`Table1`, range `F:M`).
- **Preserves Authentication**: Uses your existing Chrome cookies, sessions, extensions, and bookmarks (LinkedIn, GitHub, Google Workspaces).
- **No Warning Infobars**: Strips `--no-sandbox` and `--password-store=basic` to maintain native macOS Keychain access and prevent security infobars.

---

## Folder Structure

```
chrome-profile-agent/
├── SKILL.md                  # Main Skill Definition & YAML Frontmatter
├── README.md                 # Documentation & Setup Guide
├── mcp_config.json           # MCP Server Config Snippet
└── scripts/
    ├── easy_apply_runner.js     # End-to-end Easy Apply automation script
    ├── tailor_resume_helper.py  # Python PyMuPDF script for dynamic resume tailoring
    ├── chrome_runner.js         # Flexible CLI runner script for Playwright tasks
    ├── launch_chrome_cdp.sh     # Helper bash script to start Chrome on port 9222
    └── open_linkedin_profile.js # Preset script for opening LinkedIn
```

---

## Quick Start: LinkedIn Easy Apply

### 1. Dry-Run Mode (Review before submitting)
```bash
node scripts/easy_apply_runner.js --search ".NET Full Stack Developer" --dry-run
```

### 2. Full Application & Auto-Submit
```bash
node scripts/easy_apply_runner.js --search ".NET Developer"
```
*Applies to matching Easy Apply jobs, uploads your tailored PDF resume, fills screening questions, submits the application, and logs the entry to your Google Sheet.*
