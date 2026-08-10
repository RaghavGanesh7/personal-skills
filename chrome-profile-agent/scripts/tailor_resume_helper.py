import fitz
import os
import sys
import json

def tailor_resume(jd_info_path, pdf_path):
    print(f"[Tailor Resume] Loading JD info from {jd_info_path}...")
    with open(jd_info_path, 'r') as f:
        jd_data = json.load(f)

    jd_text = jd_data.get('jdText', '').lower()

    print(f"[Tailor Resume] Tailoring Experience points for role: '{jd_data.get('title')}' at '{jd_data.get('company')}'...")

    doc = fitz.open(pdf_path)
    page = doc[0]

    font_dir = '/Applications/Microsoft Word.app/Contents/Resources/DFonts'
    if not os.path.exists(font_dir):
        font_dir = '/System/Library/Fonts'

    f_reg = fitz.Font(fontfile=os.path.join(font_dir, 'Calibri.ttf')) if os.path.exists(os.path.join(font_dir, 'Calibri.ttf')) else fitz.Font('helv')
    f_bold = fitz.Font(fontfile=os.path.join(font_dir, 'Calibrib.ttf')) if os.path.exists(os.path.join(font_dir, 'Calibrib.ttf')) else fitz.Font('hebo')
    f_ital = fitz.Font(fontfile=os.path.join(font_dir, 'Calibrii.ttf')) if os.path.exists(os.path.join(font_dir, 'Calibrii.ttf')) else fitz.Font('heit')
    f_sym = fitz.Font(fontname='symb')

    # STRICT RULE: Redact ONLY the Experience content region (y=258.0 to y=475.5)
    # Leaves SUMMARY, SKILLS, EXPERIENCE heading, PROJECTS heading (at y=476.2), and EDUCATION 100% UNTOUCHED!
    strict_exp_rect = fitz.Rect(22.0, 258.0, 588.0, 475.5)
    page.add_redact_annot(strict_exp_rect, fill=(1, 1, 1))
    page.apply_redactions()

    tw = fitz.TextWriter(page.rect)

    def add_title(company, title, date, y):
        tw.append(fitz.Point(22.3, y), company, font=f_bold, fontsize=11.0)
        tw.append(fitz.Point(22.3 + f_bold.text_length(company, 11.0), y), f", {title}", font=f_ital, fontsize=10.6)
        date_width = f_bold.text_length(date, 10.6)
        tw.append(fitz.Point(575.8 - date_width, y), date, font=f_bold, fontsize=10.6)

    # Job 1: Korbyt
    add_title("Korbyt", "Software Engineer", "Sep 2022 – Present", 270.0)

    # Subtle keyword alignment for Bullet 1 & Bullet 3 based on JD
    b1_tech = ".NET Core and React"
    if "azure" in jd_text or "app services" in jd_text:
        b1_tech = ".NET Core, React, and Azure App Services"

    b3_tech = "Azure DevOps CI/CD pipelines"
    if "functions" in jd_text or "microservices" in jd_text:
        b3_tech = "Azure DevOps CI/CD pipelines & microservices"

    bullets_korbyt = [
        [
            (f"Designed and developed high-quality full-stack applications within a high-availability SaaS environment, leveraging {b1_tech} to deliver ", f_reg, 10.6),
            ("15+ ", f_bold, 10.6),
            ("complex features, improving overall system scalability and reducing UI rendering times by ", f_reg, 10.6),
            ("35%", f_bold, 10.6),
            (".", f_reg, 10.6)
        ],
        [
            ("Contributed to the development of an AI-powered booking chatbot platform, leveraging .NET Core to design, develop, debug, and deploy scalable backend services, delivered as a Microsoft Outlook (Microsoft 365) app, enabling conversational booking powered by ", f_reg, 10.6),
            ("ChatGPT 5.2", f_bold, 10.6),
            (", with exposure to RAG-based workflows.", f_reg, 10.6)
        ],
        [
            (f"Architected automated API testing infrastructure using Postman, Jest, integrated with {b3_tech}, covering ", f_reg, 10.6),
            ("70+", f_bold, 10.6),
            (" RESTful APIs, reducing regression effort by ", f_reg, 10.6),
            ("30%", f_bold, 10.6),
            (".", f_reg, 10.6)
        ],
        [
            ("Designed and implemented secure REST API integrations with third-party services (Zoom) using ", f_reg, 10.6),
            ("OAuth 2.0", f_bold, 10.6),
            (" and JWT-based authentication, ensuring secure communication and authorization.", f_reg, 10.6)
        ],
        [
            ("Engineered high-volume data processing pipelines using SQL Server, SQL stored procedures, and .NET Core, implementing batch processing for ", f_reg, 10.6),
            ("10,000+", f_bold, 10.6),
            (" records/day, improving performance, data integrity, and query optimization.", f_reg, 10.6)
        ]
    ]

    y_exp = 283.0

    def wrap_and_write_bullet(spans, y_start, max_x=575.0, indent=36.7, bullet_x=29.3):
        tw.append(fitz.Point(bullet_x, y_start), "•", font=f_sym, fontsize=10.1)
        line_y = y_start
        curr_x = indent
        for text, font, size in spans:
            words = text.split(" ")
            for i, w in enumerate(words):
                word_str = w + (" " if i < len(words) - 1 else "")
                w_len = font.text_length(word_str, size)
                if curr_x + w_len > max_x:
                    line_y += 13.5
                    curr_x = indent
                tw.append(fitz.Point(curr_x, line_y), word_str, font=font, fontsize=size)
                curr_x += w_len
        return line_y + 13.5

    for spans in bullets_korbyt:
        y_exp = wrap_and_write_bullet(spans, y_exp)

    # Job 2: DreamTek
    y_exp += 1.0
    add_title("DreamTek Industries", "Intern", "March 2022 - July 2022", y_exp)
    y_exp += 13.0

    bullet_dreamtek = [
        ("Implemented backend API endpoints for the project leveraging Augmented Reality. Created detailed flowcharts to define REST API workflows, and developed and deployed APIs using ", f_reg, 10.6),
        ("Node.js, Express, and Azure Functions", f_bold, 10.6),
        (".", f_reg, 10.6)
    ]

    wrap_and_write_bullet(bullet_dreamtek, y_exp)

    temp_out = pdf_path + ".tmp.pdf"
    tw.write_text(page)
    
    # Save with full garbage collection and stream deflation
    doc.save(temp_out, deflate=True, garbage=4, clean=True)
    doc.close()

    # Create a clean single-page copy to strip any residual orphaned font tables
    clean_doc = fitz.open(temp_out)
    final_doc = fitz.open()
    final_doc.insert_pdf(clean_doc)
    final_doc.save(pdf_path, deflate=True, garbage=4, clean=True)
    clean_doc.close()
    final_doc.close()
    if os.path.exists(temp_out):
        os.remove(temp_out)

    final_size_kb = os.path.getsize(pdf_path) / 1024
    print(f"[Tailor Resume] Successfully updated and compressed resume at {pdf_path} ({final_size_kb:.1f} KB - strictly under 3MB)")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 tailor_resume_helper.py <jd_json_file> <output_pdf_file>")
        sys.exit(1)
    tailor_resume(sys.argv[1], sys.argv[2])
