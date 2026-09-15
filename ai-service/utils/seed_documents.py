import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.text_splitter import chunk_document
from rag.vector_store import vector_store
from utils.sample_policies import SAMPLE_POLICIES

def seed_sample_policies():
    """Chunks and indexes sample policies into ChromaDB if not already indexed."""
    stats = vector_store.get_stats()
    print(f"[VectorStore] Existing chunks before seeding: {stats['total_chunks']}")

    total_chunks_added = 0
    for policy in SAMPLE_POLICIES:
        metadata = {
            "filename": policy["filename"],
            "title": policy["title"],
            "department": policy["department"],
            "category": policy["category"],
            "source": policy["source"],
            "doc_id": policy["filename"]
        }
        chunks = chunk_document(policy["content"], metadata, chunk_size=300, overlap=60)
        added = vector_store.add_chunks(chunks)
        total_chunks_added += added
        print(f"[VectorStore] Indexed {added} chunks for {policy['filename']}")

    updated_stats = vector_store.get_stats()
    print(f"[VectorStore] Total chunks after seeding: {updated_stats['total_chunks']}")
    return {
        "status": "success",
        "chunks_added": total_chunks_added,
        "total_chunks": updated_stats["total_chunks"]
    }

if __name__ == "__main__":
    seed_sample_policies()
