from typing import List, Dict, Any, Tuple
import re
from rag.vector_store import vector_store
from config import SIMILARITY_THRESHOLD
from utils.fallback_synthesizer import clean_text_content

def retrieve_verified_context(
    query: str, 
    department: str = "General", 
    top_k: int = 3,
    max_context_chars: int = 2400
) -> Tuple[str, List[Dict[str, Any]], str]:
    """
    Retrieves relevant document chunks from ChromaDB, evaluates confidence,
    cleans document artifacts, and formats budgeted context with source verification.
    
    Returns:
        (context_text, sources_list, overall_confidence)
    """
    results = vector_store.search(query=query, n_results=top_k, department_filter=department)

    if not results:
        return ("", [], "None")

    # Filter by similarity threshold
    valid_results = [r for r in results if r["similarity"] >= SIMILARITY_THRESHOLD]

    if not valid_results:
        return ("", [], "Low")

    top_sim = valid_results[0]["similarity"]
    if top_sim >= 0.70:
        confidence = "High"
    elif top_sim >= 0.50:
        confidence = "Medium"
    else:
        confidence = "Low"

    sources = []
    seen_sources = set()
    context_blocks = []
    current_chars = 0

    for item in valid_results:
        meta = item["metadata"]
        src_file = meta.get("source") or meta.get("filename", "Company Document")
        section = meta.get("section", "General")
        
        # Remove embedding wrapper headers and clean PDF noise
        raw_text = item["content"].replace(f"Document: {meta.get('filename')}\nSection: {section}\n\n", "")
        cleaned_text = clean_text_content(raw_text)

        # Create a clean, readable citation snippet
        clean_snippet = cleaned_text.strip()
        if len(clean_snippet) > 220:
            # Cut at last clean word boundary
            cutoff = clean_snippet[:220].rfind(" ")
            clean_snippet = clean_snippet[:cutoff if cutoff > 120 else 220] + "..."

        source_key = f"{src_file}::{section}"
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append({
                "document": src_file,
                "section": section,
                "confidence": confidence,
                "similarity": item["similarity"],
                "snippet": clean_snippet
            })

        # Add to context if within context budget
        remaining_budget = max_context_chars - current_chars
        if remaining_budget > 200:
            snippet_to_add = cleaned_text[:remaining_budget]
            context_blocks.append(
                f"[Source: {src_file} | Topic: {section}]\n{snippet_to_add}\n"
            )
            current_chars += len(snippet_to_add)

    full_context = "\n".join(context_blocks).strip()
    return (full_context, sources, confidence)

