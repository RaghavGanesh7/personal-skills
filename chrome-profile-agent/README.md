# Chrome Profile Agent Skill

A custom skill for **Google Antigravity** and MCP-compatible AI coding assistants to automate browser workflows on macOS using your actual Google Chrome profile and Playwright MCP (`@playwright/mcp`).

---

## Features
- **Preserves Authentication**: Uses your existing Chrome cookies, sessions, extensions, and bookmarks (LinkedIn, GitHub, Google Workspaces).
- **Supports Active Chrome Sessions**: Connects via Chrome Developer Protocol (CDP) on port 9222 or via cloned profile state (`~/.chrome-playwright-profile`).
- **No Warning Infobars**: Strips `--no-sandbox` and `--password-store=basic` to maintain native macOS Keychain access and prevent security infobars.
- **Google Sheets Integration**: Easily extract job details from LinkedIn and log applications directly to Google Sheets using a Service Account.

---

## Folder Structure

```
chrome-profile-agent/
├── SKILL.md              # Main Skill Definition & YAML Frontmatter
├── README.md             # Documentation & Setup Guide
├── mcp_config.json       # MCP Server Config Snippet
└── scripts/
    ├── launch_chrome_cdp.sh     # Helper bash script to start Chrome on port 9222
    ├── chrome_runner.js         # Flexible CLI runner script for Playwright tasks
    └── open_linkedin_profile.js # Preset script for opening LinkedIn
```

---

## Installation & Setup

### Option 1: Global Config (Recommended)
```bash
cp -R chrome-profile-agent ~/.gemini/config/skills/
```

### Option 2: Workspace Project
```bash
mkdir -p .agents/skills/
cp -R chrome-profile-agent .agents/skills/
```

---

## Quick Start

### 1. Launch Chrome in Remote Debugging Mode (CDP)
```bash
./scripts/launch_chrome_cdp.sh
```

### 2. Run Playwright MCP
```bash
npx -y @playwright/mcp --cdp-endpoint http://localhost:9222
```

### 3. Run Automated CLI Tasks
```bash
node scripts/chrome_runner.js --search ".NET Full Stack Developer" --keep-open
```
