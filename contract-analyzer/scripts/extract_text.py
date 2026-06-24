#!/usr/bin/env python3
import os
import sys
import subprocess

def install_and_import(package_name, import_name=None):
    if import_name is None:
        import_name = package_name
    try:
        return __import__(import_name)
    except ImportError:
        print(f"[*] Package '{package_name}' not found. Attempting to install...", file=sys.stderr)
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", package_name],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return __import__(import_name)
        except Exception as e:
            print(f"[-] Failed to install {package_name}: {e}", file=sys.stderr)
            return None

def extract_pdf(file_path):
    pypdf = install_and_import("pypdf")
    if pypdf is None:
        print("[-] Error: 'pypdf' library is required to parse PDF files. Please install it with 'pip install pypdf'.", file=sys.stderr)
        return None
    
    try:
        reader = pypdf.PdfReader(file_path)
        text_content = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n\n--- PAGE BREAK ---\n\n".join(text_content)
    except Exception as e:
        print(f"[-] Error reading PDF file: {e}", file=sys.stderr)
        return None

def extract_docx(file_path):
    # Try using textutil on macOS first as it's fast and doesn't require dependencies
    if sys.platform == "darwin":
        try:
            result = subprocess.run(["textutil", "-convert", "txt", "-stdout", file_path], 
                                    capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout
        except Exception:
            pass

    # Fallback to python-docx
    docx = install_and_import("python-docx", "docx")
    if docx is None:
        print("[-] Error: 'python-docx' library or system 'textutil' is required to parse DOCX files. Please install it with 'pip install python-docx'.", file=sys.stderr)
        return None

    try:
        doc = docx.Document(file_path)
        text_content = []
        for para in doc.paragraphs:
            text_content.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text for cell in row.cells]
                text_content.append(" | ".join(row_text))
        return "\n".join(text_content)
    except Exception as e:
        print(f"[-] Error reading DOCX file: {e}", file=sys.stderr)
        return None

def extract_rtf_or_doc(file_path):
    if sys.platform == "darwin":
        try:
            result = subprocess.run(["textutil", "-convert", "txt", "-stdout", file_path], 
                                    capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout
        except Exception as e:
            print(f"[-] Error converting file using textutil: {e}", file=sys.stderr)
    return None

def main():
    if len(sys.argv) < 2:
        print("Usage: extract_text.py <path_to_document>", file=sys.stderr)
        sys.exit(1)
        
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"[-] Error: File '{file_path}' does not exist.", file=sys.stderr)
        sys.exit(1)
        
    ext = os.path.splitext(file_path)[1].lower()
    
    text = None
    if ext == ".pdf":
        text = extract_pdf(file_path)
    elif ext == ".docx":
        text = extract_docx(file_path)
    elif ext in [".rtf", ".doc", ".html", ".htm"]:
        text = extract_rtf_or_doc(file_path)
        if text is None:
            print(f"[-] Error: Cannot parse '{ext}' file on this platform without textutil support.", file=sys.stderr)
            sys.exit(1)
    elif ext in [".txt", ".md", ".json"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception as e:
            print(f"[-] Error reading text file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Try reading as text as fallback
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except Exception:
            print(f"[-] Error: Unsupported file format '{ext}'.", file=sys.stderr)
            sys.exit(1)
            
    if text:
        print(text)
    else:
        print("[-] Failed to extract any text from the document.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
