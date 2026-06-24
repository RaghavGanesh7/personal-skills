# Personal Antigravity Skills Repository

This repository contains custom, reusable skills for Google Antigravity (AGY) to extend its developer and workflow capabilities.

## Available Skills

### 1. [Contract Analyzer](contract-analyzer/SKILL.md)
An employee-centric contract and offer letter auditor. 
- **Features**:
  - Auto-extracts text from PDF, DOCX, RTF, or TXT documents.
  - Researches local labor laws and tax codes (e.g., India/Gurugram, US, UK) via live search.
  - Automatically calculates net in-hand salary (monthly/annual) under the latest tax regimes.
  - Conducts loophole audits (IP overreach, notice period imbalances, vague bonus terms, unilateral changes).
  - Prompts you interactively to clarify contract ambiguities.
  - Generates a gorgeous, responsive, dashboard-style HTML report (`contract_analysis_report.html`).

---

## Installation & Setup

To make these skills available globally in your Antigravity environment:

### Method 1: Copy to Global Config (Recommended)
Copy the skill folder directly into your Antigravity global customizations folder:
```bash
cp -R contract-analyzer ~/.gemini/config/skills/
```

### Method 2: Copy to Project Workspace
If you only want this skill available in a specific project workspace:
```bash
mkdir -p .agents/skills/
cp -R contract-analyzer .agents/skills/
```

### Prerequisites
For document text extraction, ensure Python 3 is installed along with the `pypdf` package (used for parsing PDF files):
```bash
pip3 install pypdf
```
*(On macOS, the script will automatically fallback to the native `textutil` CLI tool for Word/DOCX/RTF files if python-docx is not installed).*
