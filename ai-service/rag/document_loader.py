import os
import pypdf

def extract_text_from_file(file_path: str) -> str:
    """Extracts raw text from PDF or text/markdown documents."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        text = ""
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text += f"\n--- Page {page_num + 1} ---\n" + page_text
        return text.strip()
    elif ext in [".txt", ".md", ".json", ".csv"]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read().strip()
    else:
        # Fallback text reading
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read().strip()
        except Exception as e:
            raise ValueError(f"Unsupported file format: {ext} ({e})")
