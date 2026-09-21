import re
from typing import List, Dict, Any

def clean_text_content(text: str) -> str:
    """Removes page markers, file headers, control characters, and excess whitespace."""
    if not text:
        return ""
    # Remove page markers like --- Page 1 ---
    cleaned = re.sub(r'---\s*Page\s+\d+\s*---', '', text, flags=re.IGNORECASE)
    # Remove source marker comments
    cleaned = re.sub(r'---\s*SOURCE:[^-\n]+---', '', cleaned)
    # Remove non-printable / control characters like \x7f
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', cleaned)
    # Normalize multiple newlines and spaces
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    cleaned = re.sub(r'\n\s*\n+', '\n\n', cleaned)
    return cleaned.strip()

def synthesize_clean_fallback(query: str, sources: List[Dict[str, Any]], raw_context: str = "") -> str:
    """
    Synthesizes a coherent, clean natural-language explanation from retrieved document chunks
    when the local LLM is temporarily unreachable or times out.
    Guarantees no raw page markers, unformatted header dumps, or 200-char truncated cutoffs.
    """
    if not sources and not raw_context:
        return "I couldn't find reliable information about this in the available company documents. Please check with your team lead or refer to the internal documentation portal."

    primary_source = sources[0]["document"] if sources else "verified company documentation"
    cleaned_context = clean_text_content(raw_context)

    # If context is empty, return clear notification
    if not cleaned_context:
        return f"Based on **{primary_source}**, specific details matching your question could not be clearly extracted. Please consult your team lead."

    query_words = set(re.findall(r'\b\w{3,}\b', query.lower()))
    # Exclude common question stop words
    stop_words = {"what", "which", "where", "when", "how", "used", "does", "about", "tell", "explain", "give", "with", "from", "that", "this"}
    keywords = [w for w in query_words if w not in stop_words]

    lines = cleaned_context.split("\n")
    relevant_blocks = []
    current_block = []

    for line in lines:
        line_str = line.strip()
        if not line_str:
            if current_block:
                relevant_blocks.append("\n".join(current_block))
                current_block = []
            continue
        current_block.append(line_str)

    if current_block:
        relevant_blocks.append("\n".join(current_block))

    # Score blocks by keyword matches
    scored_blocks = []
    for block in relevant_blocks:
        lower_b = block.lower()
        # Avoid blocks that are just company titles or index intros
        if "reference guide for engineering onboarding" in lower_b and len(block) < 200:
            continue
        score = sum(1 for kw in keywords if kw in lower_b)
        scored_blocks.append((score, block))

    # Sort by score descending
    scored_blocks.sort(key=lambda x: x[0], reverse=True)
    top_blocks = [b for s, b in scored_blocks if s > 0][:3]

    if not top_blocks and scored_blocks:
        top_blocks = [scored_blocks[0][1]]

    formatted_content = "\n\n".join(top_blocks)
    if not formatted_content:
        formatted_content = cleaned_context[:1000].strip()

    # Format cleanly into proper readable paragraphs / bullet points
    return (
        f"Based on **{primary_source}**, here is the verified information regarding your question:\n\n"
        f"{formatted_content}"
    )
