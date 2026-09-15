import os
import pypdf

def extract_text_from_file(file_path: str) -> str:
    """Extracts raw text from PDF or text/markdown documents."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    if os.path.getsize(file_path) == 0:
        raise ValueError("Uploaded file is empty (0 bytes).")
    
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    if ext == ".pdf":
        try:
            with open(file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                if len(reader.pages) == 0:
                    raise ValueError("PDF contains no pages.")
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    text += f"\n--- Page {page_num + 1} ---\n" + page_text
        except Exception as e:
            raise ValueError(f"Could not parse PDF file: {str(e)}")
    elif ext in [".txt", ".md", ".json", ".csv"]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    else:
        # Fallback text reading
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
        except Exception as e:
            raise ValueError(f"Unsupported file format: {ext} ({e})")

    cleaned_text = text.strip()
    if not cleaned_text:
        raise ValueError("No readable text found in the document.")
    return cleaned_text
