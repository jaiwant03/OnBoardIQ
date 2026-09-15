import re
from typing import List, Dict, Any

def detect_sections(text: str) -> List[Dict[str, str]]:
    """
    Detects headings and sections in the text.
    Handles Markdown headers, numbered headers (e.g. 1.0, 2.1), and ALL CAPS headers.
    """
    lines = text.split("\n")
    sections = []
    current_section = "General Overview"
    current_content = []

    header_pattern = re.compile(r'^(#{1,4}\s+|(?:\d+\.){1,3}\s+|[A-Z\s]{4,}:?\s*$)', re.MULTILINE)

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line looks like a header
        if (line.startswith("#") or 
            re.match(r'^(?:\d+\.|\d+\.\d+)\s+[A-Z]', stripped) or 
            (stripped.isupper() and len(stripped) > 4 and len(stripped) < 60) or
            re.match(r'^(Section|Policy|Chapter|Clause)\s+\d+', stripped, re.IGNORECASE)):
            
            if current_content:
                sections.append({
                    "section": current_section,
                    "content": "\n".join(current_content).strip()
                })
                current_content = []
            current_section = re.sub(r'^[#\s]+', '', stripped)
        else:
            current_content.append(line)

    if current_content:
        sections.append({
            "section": current_section,
            "content": "\n".join(current_content).strip()
        })

    if not sections:
        sections.append({"section": "Document Content", "content": text})

    return sections

def chunk_document(text: str, metadata: Dict[str, Any], chunk_size: int = 400, overlap: int = 80) -> List[Dict[str, Any]]:
    """
    Splits text into contextual chunks keeping track of section titles and metadata.
    """
    sections = detect_sections(text)
    chunks = []
    chunk_index = 0

    for sec in sections:
        section_title = sec["section"]
        content = sec["content"]
        
        words = content.split()
        if not words:
            continue

        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)

            if len(chunk_text.strip()) > 30: # Ignore tiny noise
                chunk_meta = {
                    "filename": metadata.get("filename", "Unknown Document"),
                    "department": metadata.get("department", "General"),
                    "category": metadata.get("category", "General"),
                    "source": metadata.get("source", metadata.get("filename", "Unknown Document")),
                    "section": section_title,
                    "chunk_index": chunk_index,
                    "doc_id": metadata.get("doc_id", "")
                }
                chunks.append({
                    "id": f"{metadata.get('filename', 'doc')}_{chunk_index}",
                    "text": f"Document: {chunk_meta['filename']}\nSection: {section_title}\n\n{chunk_text}",
                    "raw_text": chunk_text,
                    "metadata": chunk_meta
                })
                chunk_index += 1

            i += (chunk_size - overlap)
            if i >= len(words) and len(chunk_words) == len(words):
                break

    return chunks
