---
name: chrome-profile-agent
description: Drive active Google Chrome sessions and user profiles using Playwright MCP on macOS. Use this skill when requested to automate browser tasks using the user's real Chrome profile, active logins, cookies, or existing tabs, and optionally sync data with Google Sheets.
metadata:
  version: 1.1.0
  author: Raghav Ganesh
  license: MIT
  tags:
    - browser-automation
    - playwright
    - chrome-profile
    - linkedin-jobs
    - google-sheets
---

# Playwright Chrome Profile Agent

The **Chrome Profile Agent** connects Google Antigravity (and other MCP-compatible AI assistants) to your active Google Chrome profile on macOS using **Playwright MCP** (`@playwright/mcp`). It allows AI agents to interact with logged-in web applications (LinkedIn, GitHub, Google Workspaces, dashboards) without requiring re-authentication.

---

## Capabilities & Triggers

Trigger this skill whenever you need to:
- Navigate web pages using active Chrome logins, cookies, and extensions.
- Automate job searches (e.g. LinkedIn Jobs) and extract job descriptions.
- Tailor PDF resumes based on extracted Job Descriptions.
- Automatically log job search data to Google Sheets (`Job Tracker`).

---

## Operating Modes

### Mode 1: CDP Connection (Recommended - Active Chrome Session)
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

### Mode 2: Cloned Profile Session (Co-existence with Open Chrome)
If Chrome is currently open and cannot be restarted in CDP mode, Playwright syncs essential session state (`Cookies`, `Web Data`, `Local Storage`, `Preferences`, `Login Data`) to `~/.chrome-playwright-profile` to bypass Chrome's `SingletonLock` while preserving native macOS Keychain authentication:

```bash
node scripts/chrome_runner.js --url "https://www.linkedin.com/jobs/"
```

---

## Interactive CLI Runner (`chrome_runner.js`)

A portable CLI script is provided in `scripts/chrome_runner.js` to execute automated tasks:

```bash
# Open a specific URL using your Chrome profile
node scripts/chrome_runner.js --url "https://www.linkedin.com/jobs/search/?keywords=.NET"

# Extract job details and append directly to Google Sheets
node scripts/chrome_runner.js \
  --search ".NET Full Stack Developer" \
  --sheet-id "1cd8DZPMESnoE2ZgaqwlqHIP7N0a4dCGpNKhABf8z6Bs" \
  --key-file "../n8n-rg-480823-007cd4d5ffef.json"
```

---

## Integration Setup for Teams

To share this skill across team repositories or AI IDEs:

### 1. Global Installation (Antigravity)
```bash
cp -R chrome-profile-agent ~/.gemini/config/skills/
```

### 2. Project Workspace Installation
```bash
mkdir -p .agents/skills/
cp -R chrome-profile-agent .agents/skills/
```

### 3. MCP Configuration (`mcp_config.json`)
Add to `mcp.json` or IDE settings:
```json
{
  "mcpServers": {
    "playwright-chrome": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp",
        "--cdp-endpoint",
        "http://localhost:9222"
      ]
    }
  }
}
```
