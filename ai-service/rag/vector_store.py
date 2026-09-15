import os
import chromadb
from typing import List, Dict, Any, Optional
import requests
from config import CHROMA_DB_PATH, OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL

class LocalEmbeddingFunction:
    """Embedding function supporting Ollama high-performance batch embeddings or local sentence-transformers fallback."""
    def __init__(self, ollama_url: str = OLLAMA_BASE_URL, model_name: str = OLLAMA_EMBED_MODEL):
        self.ollama_url = ollama_url
        self.model_name = model_name
        self.st_model = None

    def __call__(self, input: List[str]) -> List[List[float]]:
        if not input:
            return []

        # 1. Try high-performance Ollama /api/embed batch API first
        try:
            embeddings = []
            # Batch in groups of 25 to maximize Ollama throughput without memory spikes
            batch_size = 25
            for i in range(0, len(input), batch_size):
                batch = input[i:i + batch_size]
                resp = requests.post(
                    f"{self.ollama_url}/api/embed",
                    json={"model": self.model_name, "input": batch},
                    timeout=45
                )
                if resp.status_code == 200:
                    data = resp.json()
                    batch_embs = data.get("embeddings", [])
                    if batch_embs and len(batch_embs) == len(batch):
                        embeddings.extend(batch_embs)
                    else:
                        raise RuntimeError(f"Mismatch in returned embeddings count: expected {len(batch)}, got {len(batch_embs)}")
                else:
                    raise RuntimeError(f"Ollama /api/embed returned status {resp.status_code}")

            if len(embeddings) == len(input):
                return embeddings
        except Exception as batch_err:
            print(f"[LocalEmbeddingFunction] Ollama batch /api/embed failed ({batch_err}), checking fallback...")

        # 2. Try single /api/embeddings with longer timeout for single queries
        if len(input) <= 3:
            try:
                embeddings = []
                for text in input:
                    resp = requests.post(
                        f"{self.ollama_url}/api/embeddings",
                        json={"model": self.model_name, "prompt": text},
                        timeout=20
                    )
                    if resp.status_code == 200:
                        embeddings.append(resp.json().get("embedding"))
                    else:
                        raise RuntimeError("Ollama legacy embedding API returned non-200")
                if len(embeddings) == len(input):
                    return embeddings
            except Exception as legacy_err:
                print(f"[LocalEmbeddingFunction] Legacy embedding failed ({legacy_err}), falling back to SentenceTransformer...")

        # 3. Fallback to local SentenceTransformer
        try:
            if self.st_model is None:
                from sentence_transformers import SentenceTransformer
                self.st_model = SentenceTransformer("all-MiniLM-L6-v2")
            emb = self.st_model.encode(input, convert_to_numpy=True, batch_size=32)
            return emb.tolist()
        except Exception as st_err:
            print(f"[LocalEmbeddingFunction] SentenceTransformer fallback error: {st_err}")
            raise

class VectorStoreManager:
    """Manages ChromaDB collections for company onboarding documents."""
    def __init__(self, persist_directory: str = CHROMA_DB_PATH):
        self.persist_directory = persist_directory
        os.makedirs(self.persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.embedding_fn = LocalEmbeddingFunction()
        self.collection = self.client.get_or_create_collection(
            name="onboardiq_knowledge",
            metadata={"hnsw:space": "cosine"}
        )

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        if not chunks:
            return 0
        
        ids = [c["id"] for c in chunks]
        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        # Generate embeddings
        embeddings = self.embedding_fn(texts)

        # Upsert into ChromaDB
        self.collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
        return len(chunks)

    def search(self, query: str, n_results: int = 4, department_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query_embedding = self.embedding_fn([query])[0]
        
        where_filter = None
        if department_filter and department_filter.lower() != "all" and department_filter.lower() != "general":
            where_filter = {"$or": [
                {"department": department_filter},
                {"department": "General"}
            ]}

        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"]
        }
        if where_filter:
            kwargs["where"] = where_filter

        try:
            results = self.collection.query(**kwargs)
        except Exception:
            # Retry without filter if filter causes syntax issue
            kwargs.pop("where", None)
            results = self.collection.query(**kwargs)

        hits = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

            for i in range(len(docs)):
                # In cosine space, distance is 1 - cosine_similarity (range 0 to 2)
                # Similarity = 1 - distance
                dist = distances[i]
                sim = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                hits.append({
                    "content": docs[i],
                    "metadata": metas[i],
                    "distance": dist,
                    "similarity": round(sim, 3)
                })

        # Sort by similarity descending
        hits.sort(key=lambda x: x["similarity"], reverse=True)
        return hits

    def get_stats(self) -> Dict[str, Any]:
        count = self.collection.count()
        return {
            "total_chunks": count,
            "collection_name": self.collection.name,
            "persist_directory": self.persist_directory
        }

    def delete_document(self, filename: str) -> bool:
        try:
            self.collection.delete(where={"filename": filename})
            return True
        except Exception:
            return False

# Global instance
vector_store = VectorStoreManager()
