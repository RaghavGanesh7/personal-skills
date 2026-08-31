# Personal Antigravity Skills Repository

This repository contains custom, reusable skills for Google Antigravity (AGY) to extend its developer and workflow capabilities.

## Available Skills

### 1. [Work To Doc](work-to-doc/SKILL.md)
Turn any completed technical implementation, server setup, infrastructure deployment, architectural change, or feature into clean, reusable, easy-to-follow documentation and operational runbooks.
- **Features**:
  - Gathers system specs, access credentials, daemon configurations, and storage layouts from the live session.
  - Interactive destination prompts (`~/Documents/...`, `docs/`, or custom paths).
  - Generates standardized quick-reference tables, config references, and daily maintenance runbooks.
  - Includes modular templates for Server Infrastructure, Feature Implementations, and Operational Cheatsheets.

### 2. [Contract Analyzer](contract-analyzer/SKILL.md)
An employee-centric contract and offer letter auditor. 
- **Features**:
  - Auto-extracts text from PDF, DOCX, RTF, or TXT documents.
  - Researches local labor laws and tax codes (e.g., India/Gurugram, US, UK) via live search.
  - Automatically calculates net in-hand salary (monthly/annual) under the latest tax regimes.
  - Conducts loophole audits (IP overreach, notice period imbalances, vague bonus terms, unilateral changes).
  - Prompts you interactively to clarify contract ambiguities.
  - Generates a gorgeous, responsive, dashboard-style HTML report (`contract_analysis_report.html`).

### 3. [Chrome Profile Agent](chrome-profile-agent/SKILL.md)
Drive active Google Chrome sessions and user profiles using Playwright MCP on macOS.
- **Features**:
  - Connects to your active Chrome browser via CDP (`--remote-debugging-port=9222`).
  - Preserves all active logins, cookies, extensions, and bookmarks.
  - Supports persistent profile directory launch mode.
  - Includes `launch_chrome_cdp.sh` helper script and MCP configuration templates.

---

## Installation & Setup

To make these skills available globally in your Antigravity environment:

### Method 1: Copy to Global Config (Recommended)
Copy skill folders directly into your Antigravity global customizations folder:
```bash
cp -R work-to-doc ~/.gemini/config/skills/
cp -R contract-analyzer ~/.gemini/config/skills/
cp -R chrome-profile-agent ~/.gemini/config/skills/
```

### Method 2: Copy to Project Workspace
If you only want skills available in a specific project workspace:
```bash
mkdir -p .agents/skills/
cp -R work-to-doc .agents/skills/
cp -R contract-analyzer .agents/skills/
cp -R chrome-profile-agent .agents/skills/
```

### Method 3: Team Sharing via `skills.json` (Recommended for Shared Repos)
To share skills across team projects, include a `skills.json` file in your customization root (`.agents/skills.json`):
```json
{
  "entries": [
    { "path": "path/to/personal-skills/work-to-doc" },
    { "path": "path/to/personal-skills/chrome-profile-agent" },
    { "path": "path/to/personal-skills/contract-analyzer" }
  ]
}
```

### Prerequisites
For document text extraction, ensure Python 3 is installed along with the `pypdf` package (used for parsing PDF files):
```bash
pip3 install pypdf
```
*(On macOS, the script will automatically fallback to the native `textutil` CLI tool for Word/DOCX/RTF files if python-docx is not installed).*
