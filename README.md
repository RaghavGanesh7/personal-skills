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

### 4. [Homelab Gateway](homelab-gateway/SKILL.md)
Deploy and manage a complete, secure homelab reverse proxy and remote access gateway on a Linux home server using Docker, Caddy, and Tailscale.
- **Features**:
  - Automatically scans active network interfaces, current IP, default gateway, and running Docker containers via `detect_services.sh`.
  - Locks static LAN IPs in NetworkManager to prevent router DHCP shifts.
  - Provisions Caddy v2 with automated HTTPS (local CA for internal network, official Let's Encrypt certificates via Tailscale MagicDNS).
  - Routes services like Portainer and Cockpit on standard HTTPS (port 443) using clean subpaths with zero port numbers.
  - Generates adaptive landing page dashboards and handles macOS client integration (trusting root CA, Chrome DNS-over-HTTPS bypasses).
  - Provides end-to-end automated verification and operational maintenance runbooks.

---

### 5. [Repo To 3D Course](repo-to-3d-course/SKILL.md)
Turn any educational GitHub repository (book, course, handbook, lecture notes) into a static, brutalist 3D course website that people can actually read.
- **Features**:
  - Copies the upstream markdown verbatim and generates one page per lesson into `docs/` — no framework, two npm dependencies, GitHub Pages ready.
  - 3D where it aids recognition: a Three.js hero whose geometry reflects the subject, CSS-3D module covers with spine and pointer tilt.
  - Reader built for long material: heading-first full-text search, live per-lesson outline, reading times, auto "mark as read", resume-where-you-left-off, keyboard-first navigation, light/dark themes.
  - Build-time Prism highlighting, single-cell-table callouts lifted into real asides, heading anchors and `.md` → `.html` link rewriting.
  - `scaffold.sh` to start a project, `check_site.mjs` to gate on dead links/anchors and escaping bugs, `shots.mjs` for a headless screenshot matrix (desktop + phone, light + dark).
  - Licence-first workflow: upstream licence identified and carried over, author credited in every footer and on an About page.

---

## Installation & Setup

To make these skills available globally in your Antigravity environment:

### Method 1: Copy to Global Config (Recommended)
Copy skill folders directly into your Antigravity global customizations folder:
```bash
cp -R work-to-doc ~/.gemini/config/skills/
cp -R contract-analyzer ~/.gemini/config/skills/
cp -R chrome-profile-agent ~/.gemini/config/skills/
cp -R homelab-gateway ~/.gemini/config/skills/
cp -R repo-to-3d-course ~/.gemini/config/skills/
```

### Method 2: Copy to Project Workspace
If you only want skills available in a specific project workspace:
```bash
mkdir -p .agents/skills/
cp -R work-to-doc .agents/skills/
cp -R contract-analyzer .agents/skills/
cp -R chrome-profile-agent .agents/skills/
cp -R homelab-gateway .agents/skills/
cp -R repo-to-3d-course .agents/skills/
```

### Method 3: Team Sharing via `skills.json` (Recommended for Shared Repos)
To share skills across team projects, include a `skills.json` file in your customization root (`.agents/skills.json`):
```json
{
  "entries": [
    { "path": "path/to/personal-skills/work-to-doc" },
    { "path": "path/to/personal-skills/chrome-profile-agent" },
    { "path": "path/to/personal-skills/contract-analyzer" },
    { "path": "path/to/personal-skills/homelab-gateway" },
    { "path": "path/to/personal-skills/repo-to-3d-course" }
  ]
}
```

### Prerequisites
For document text extraction, ensure Python 3 is installed along with the `pypdf` package (used for parsing PDF files):
```bash
pip3 install pypdf
```
*(On macOS, the script will automatically fallback to the native `textutil` CLI tool for Word/DOCX/RTF files if python-docx is not installed).*
