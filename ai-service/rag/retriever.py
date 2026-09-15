from typing import List, Dict, Any, Tuple
from rag.vector_store import vector_store
from config import SIMILARITY_THRESHOLD

def retrieve_verified_context(
    query: str, 
    department: str = "General", 
    top_k: int = 3
) -> Tuple[str, List[Dict[str, Any]], str]:
    """
    Retrieves relevant document chunks from ChromaDB, evaluates confidence,
    and formats context with source verification.
    
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

    for item in valid_results:
        meta = item["metadata"]
        src_file = meta.get("source") or meta.get("filename", "Company Document")
        section = meta.get("section", "General")
        snippet = item["content"].replace(f"Document: {meta.get('filename')}\nSection: {section}\n\n", "")
        
        # Deduplicate sources
        source_key = f"{src_file}::{section}"
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append({
                "document": src_file,
                "section": section,
                "confidence": confidence,
                "similarity": item["similarity"],
                "snippet": snippet[:200] + "..." if len(snippet) > 200 else snippet
            })

        context_blocks.append(
            f"--- SOURCE: {src_file} | SECTION: {section} ---\n{snippet}\n"
        )

    full_context = "\n".join(context_blocks)
    return (full_context, sources, confidence)
