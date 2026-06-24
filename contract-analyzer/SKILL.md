---
name: contract-analyzer
description: Analyze an employee contract or offer letter to find red flags, calculate in-hand salary after taxes, research local labor laws, and generate a beautiful HTML dashboard report. Trigger on: 'analyze contract', 'contract analysis', 'offer letter review', 'review employee contract', 'check my offer letter', 'contract red flags', 'analyze my offer letter'.
---

# Employment Contract Analyzer & Legal Researcher Skill

This skill guides you through conducting a comprehensive, employee-centric review of an offer letter or employment contract. Follow these steps sequentially:

## 1. Document Detection and Ingestion
- Scan the workspace directory (`/Users/raghavganesh`) for any PDF, DOCX, TXT, or RTF files with names containing `offer`, `contract`, `employment`, `agreement`, `joining`, or `appointment`.
- If a file is found, state that you've detected it (e.g., "I've detected `offer_letter.pdf` in your workspace...") and ask if the user wants to analyze this file.
- If multiple candidate files are found, present them in a numbered list and ask the user which one they would like to analyze.
- If no files are found, ask the user to:
  1. Provide the absolute file path of the document.
  2. Upload/move the document to the workspace.
  3. Or copy and paste the raw text of the contract directly into the chat.
- Once a file path is confirmed, execute the extraction script to convert it into raw text:
  ```bash
  python3 /Users/raghavganesh/.gemini/config/skills/contract-analyzer/scripts/extract_text.py <filepath>
  ```
- Store the extracted contract text in memory for analysis.

## 2. Jurisdiction & Core Terms Extraction
- Parse the contract text to extract:
  - **Employer Name** and **Employee Name**.
  - **Job Title** and **Job Description/Scope**.
  - **Base Salary** & other compensation items (bonuses, commissions, equity, allowances).
  - **Work Location** & governing law clause (e.g., State of California, India - Karnataka, UK).
  - **Working Hours** and overtime terms.
  - **Probation Period** (length, extension clauses).
  - **Notice Period & Termination** (resignation notice, termination notice, severance).
  - **Non-compete & Non-solicit** constraints.
  - **Intellectual Property (IP) Rights** assignment.
- **Jurisdiction Fallback**: If the contract does not explicitly state the governing jurisdiction or work location, ask the user:
  > "I couldn't identify the governing jurisdiction or work location in the contract. Could you tell me which Country and State/Province this job is located in so I can research the correct labor laws and tax brackets?"

## 3. Web Research (Labor Laws & Tax Calculations)
- Once the jurisdiction is known, conduct specific web searches using the `search_web` tool:
  1. **Employment Laws**: Search for statutory requirements in that jurisdiction regarding:
     - Notice period limits (minimum employee notice vs employer obligations).
     - Probationary limits (maximum length allowed by law).
     - Non-compete enforceability (e.g., completely void in California/Minnesota, or requiring compensation in Germany).
     - Inventions assignment law (e.g., California Labor Code Section 2870, Washington RCWA 49.44.140, etc.).
     - Minimum annual/sick leave.
  2. **Tax Calculations**: Search for the current tax brackets (e.g., 2026 or latest available) for that jurisdiction (Federal, State/Regional, and Local taxes) and social insurance/pension rates (e.g., FICA in the US, National Insurance in the UK, EPF/ESIC in India).
- Calculate:
  - Gross annual and monthly pay.
  - Estimated income taxes (Federal + State/Regional).
  - Estimated social contributions/pension (employee portion).
  - Estimated in-hand net salary (monthly and annual).

## 4. Red Flag & Loophole Auditing
Analyze the contract clauses for employee-unfriendly traps, including:
- **Intellectual Property (IP) Overreach**: Clauses that claim ownership of inventions made on personal time, with personal equipment, unrelated to the company's business.
- **Vague Compensation/Bonus terms**: "Discretionary bonuses" that have no concrete targets, enabling the company to withhold them at will.
- **Unbalanced Notice Periods**: Employee must give 60 days, but employer can terminate with 0 or 1 day notice, or without cause and without severance.
- **Broad Non-compete/Non-solicit**: Restricting work in the same industry globally or for an excessive duration (e.g., >1 year) without compensation.
- **Indemnification clauses**: Forcing the employee to personally pay for legal costs if the company gets sued.
- **Overtime Loophole**: Classifying the employee as exempt or forcing extra hours without pay when local laws mandate overtime pay.
- **Indefinite Probation**: Allowing the company to extend probation indefinitely at its sole discretion, keeping the employee on reduced benefits or lower job security.

## 5. Interactive Clarification ("Grilling")
Before generating the final HTML report, compile **2 to 3 targeted clarification questions** based on ambiguities or suspicious clauses found in the contract.
- Present these questions to the user in the chat using standard text.
- *Examples of grilling questions*:
  - "The contract states that your bonus is 'discretionary and subject to company performance.' Did they provide you with any written target metrics or a verbal structure for how this bonus is earned?"
  - "The IP assignment clause is very broad and covers all creations during your employment. Are you working on any side projects or open-source software that we should explicitly exclude to prevent the employer from claiming ownership?"
  - "The contract specifies that you may be required to work additional hours without extra pay. Do you expect this role to frequently demand more than 40 hours a week?"
- Wait for the user's responses. Use their feedback to refine the calculations and red flags.

## 6. HTML Report Generation
Create a beautiful, single-file HTML report named `contract_analysis_report.html` in the workspace directory.
- Apply modern, premium CSS design principles (do NOT use Tailwind unless explicitly asked; use custom styled, clean Vanilla CSS with beautiful variables, dark/light theme options, responsive grid/flexbox layouts, Google Fonts (Inter/Outfit), and glassmorphic panels).
- **Core Elements of the HTML Report**:
  - **Hero Header**: Job title, employer name, employee name, jurisdiction, and date of analysis.
  - **Employee Friendliness Score**: A stunning visual gauge/ring chart (0-100) indicating the safety score.
    - *Score Guide*: 85-100 (Safe), 60-84 (Caution/Negotiate), <60 (High Risk/Red Flags).
  - **Detailed Executive Summary**: Brief bullet points of the contract's overall health.
  - **In-Hand Salary Calculator Panel**:
    - Detailed table and visual bar charts showing Gross vs Deductions (Federal Tax, State Tax, Retirement/Pension, Social Security/Insurance) vs Net In-Hand Pay.
    - Calculated as Monthly and Annual values.
  - **Red Flags & Loopholes Table**:
    - Severity badges: `CRITICAL` (Red), `WARNING` (Amber), `INFO` (Blue).
    - Table columns: `Clause Category`, `Contract Text`, `Risk / Loophole Explained`, `Legal Basis / Advice`.
  - **Legal Alignment Checklist**:
    - Comparison table of contract terms vs local statutory minimums (e.g., notice period, paid leaves, probation caps, non-compete enforceability).
  - **Recommended Counter-proposals (Redlines)**:
    - Side-by-side or clear suggestions of current phrasing vs employee-friendly recommended alternative phrasing.
- Write the HTML file to the workspace. Provide a clickable link in the chat in the exact format: `[contract_analysis_report.html](file:///Users/raghavganesh/contract_analysis_report.html)`.
- If the user responds with answers to the grilling questions, re-run the calculations, update the score, and regenerate the HTML file.
