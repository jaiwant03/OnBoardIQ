import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from config import PORT, OLLAMA_MODEL, OLLAMA_BASE_URL
from utils.llm_client import check_ollama_status, call_ollama
from rag.vector_store import vector_store
from rag.document_loader import extract_text_from_file
from rag.text_splitter import chunk_document
from utils.seed_documents import seed_sample_policies
from utils.document_extractor import extract_onboarding_data_from_document, extract_heuristic_tasks_and_learning
from agents.graph import agent_graph
from agents.state import AgentState

app = FastAPI(
    title="OnboardIQ AI Service",
    description="Autonomous Agentic RAG & Onboarding Service powered by LangGraph, ChromaDB, and Ollama",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: initialize cleanly without auto-seeding sample policies
@app.on_event("startup")
async def on_startup():
    print("[OnboardIQ AI Service] Starting up...")
    stats = vector_store.get_stats()
    print(f"[OnboardIQ AI Service] ChromaDB initialized with {stats['total_chunks']} chunks.")

from agents.tools import evaluate_next_best_action

# Request Models
class ChatRequest(BaseModel):
    query: str
    user_name: Optional[str] = "Employee"
    user_role: Optional[str] = "Software Developer"
    user_department: Optional[str] = "Engineering"
    user_experience: Optional[str] = "Fresher"
    conversation_history: Optional[List[Dict[str, str]]] = []
    completed_tasks: Optional[List[str]] = []
    pending_tasks: Optional[List[Dict[str, Any]]] = []
    progress_percentage: Optional[float] = 0.0
    skills: Optional[List[str]] = []

class PlanRequest(BaseModel):
    role: str = "Software Developer"
    department: str = "Engineering"
    experience: str = "Fresher"
    skills: Optional[List[str]] = []
    preferred_learning_style: Optional[str] = "Hands-on Projects"

class NextActionRequest(BaseModel):
    completed_tasks: List[str] = []
    pending_tasks: List[Dict[str, Any]] = []
    role: str = "Software Developer"
    department: str = "Engineering"
    progress_percentage: float = 0.0

class IndexDocumentRequest(BaseModel):
    file_path: Optional[str] = None
    raw_text: Optional[str] = None
    filename: str
    department: str = "General"
    category: str = "General"
    doc_id: Optional[str] = None

class ExtractTasksRequest(BaseModel):
    file_path: Optional[str] = None
    raw_text: Optional[str] = None
    filename: str
    department: Optional[str] = "General"
    category: Optional[str] = "General"
    fast: Optional[bool] = False

# Endpoints
@app.get("/health")
async def health_check():
    ollama_info = check_ollama_status()
    chroma_info = vector_store.get_stats()
    return {
        "status": "healthy",
        "service": "OnboardIQ AI Intelligence Service",
        "ollama": ollama_info,
        "chromadb": chroma_info,
        "active_model": OLLAMA_MODEL
    }

@app.post("/api/ai/chat")
async def chat_endpoint(req: ChatRequest):
    initial_state: AgentState = {
        "query": req.query,
        "user_name": req.user_name,
        "user_role": req.user_role,
        "user_department": req.user_department,
        "user_experience": req.user_experience,
        "conversation_history": req.conversation_history or [],
        "completed_tasks": req.completed_tasks or [],
        "pending_tasks": req.pending_tasks or [],
        "progress_percentage": req.progress_percentage or 0.0,
        "skills": req.skills or [],
        "intent": None,
        "assigned_agent": None,
        "context": None,
        "sources": [],
        "confidence": "Medium",
        "reasoning": None,
        "response": None,
        "is_verified": False,
        "tools_used": []
    }

    try:
        final_state = agent_graph.invoke(initial_state)
        
        agent_names = {
            "hr_agent": "HR Agent",
            "it_agent": "IT Agent",
            "learning_agent": "Learning Agent",
            "onboarding_agent": "Onboarding Agent"
        }
        assigned_name = agent_names.get(final_state.get("assigned_agent"), "OnboardIQ Agent")

        return {
            "response": final_state.get("response"),
            "agent": assigned_name,
            "agent_id": final_state.get("assigned_agent"),
            "sources": final_state.get("sources", []),
            "confidence": final_state.get("confidence", "High"),
            "reasoning": final_state.get("reasoning"),
            "is_verified": final_state.get("is_verified", True),
            "tools_used": final_state.get("tools_used", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent workflow error: {str(e)}")

@app.post("/api/ai/onboarding-plan")
async def generate_onboarding_plan(req: PlanRequest):
    """
    Returns onboarding tasks. In accordance with user policy, tasks are only
    provided when documents are uploaded to the system.
    """
    role = req.role or "Software Developer"
    level = req.experience or "Fresher"
    return {"role": role, "experience": level, "tasks": []}

@app.post("/api/ai/next-action")
async def get_next_best_action(req: NextActionRequest):
    """
    Autonomous Next Best Action: Uses evaluate_next_best_action tool
    with employee state and LLM reasoning to explain why this task is next.
    """
    return evaluate_next_best_action(
        pending_tasks=req.pending_tasks,
        completed_tasks=req.completed_tasks,
        role=req.role,
        department=req.department
    )

@app.post("/api/ai/learning-path")
async def generate_learning_path(req: PlanRequest):
    """
    Returns learning path stages. In accordance with user policy, learning paths
    are only generated when documents are uploaded to the system.
    """
    role = req.role or "Software Developer"
    return {"role": role, "stages": []}

@app.post("/api/ai/index-document")
async def index_document(req: IndexDocumentRequest):
    """
    Extracts text from file, chunks & indexes into ChromaDB,
    and dynamically extracts actionable onboarding tasks and learning curriculum stages.
    """
    try:
        if req.raw_text:
            text = req.raw_text
        elif req.file_path:
            text = extract_text_from_file(req.file_path)
        else:
            raise HTTPException(status_code=400, detail="Either file_path or raw_text must be provided.")

        metadata = {
            "filename": req.filename,
            "department": req.department,
            "category": req.category,
            "source": req.filename,
            "doc_id": req.doc_id or req.filename
        }

        chunks = chunk_document(text, metadata, chunk_size=300, overlap=60)
        if not chunks:
            raise HTTPException(status_code=400, detail="No readable text or sections could be extracted from document.")
            
        chunks_indexed = vector_store.add_chunks(chunks)

        # Extract real onboarding tasks and curriculum derived directly from this document!
        extracted_data = extract_onboarding_data_from_document(
            text=text,
            filename=req.filename,
            department=req.department,
            category=req.category
        )

        return {
            "status": "indexed",
            "filename": req.filename,
            "chunks_indexed": chunks_indexed,
            "total_collection_chunks": vector_store.get_stats()["total_chunks"],
            "extracted_tasks": extracted_data.get("tasks", []),
            "extracted_learning_path": extracted_data.get("learning_path", {"stages": []})
        }
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@app.post("/api/ai/extract-tasks")
async def extract_tasks_endpoint(req: ExtractTasksRequest):
    """
    Extracts actionable onboarding tasks and learning curriculum stages from a file or text
    without modifying ChromaDB embeddings.
    """
    try:
        if req.raw_text:
            text = req.raw_text
        elif req.file_path:
            text = extract_text_from_file(req.file_path)
        else:
            raise HTTPException(status_code=400, detail="Either file_path or raw_text must be provided.")

        if req.fast:
            extracted_data = extract_heuristic_tasks_and_learning(
                text=text,
                filename=req.filename,
                department=req.department or "General",
                category=req.category or "General"
            )
        else:
            extracted_data = extract_onboarding_data_from_document(
                text=text,
                filename=req.filename,
                department=req.department or "General",
                category=req.category or "General"
            )

        return {
            "status": "success",
            "filename": req.filename,
            "tasks": extracted_data.get("tasks", []),
            "learning_path": extracted_data.get("learning_path", {"stages": []})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task extraction failed: {str(e)}")

@app.post("/api/ai/clear-vector-store")
async def clear_vector_store_endpoint():
    """Clears all chunks from ChromaDB so no sample or orphaned vector data persists."""
    success = vector_store.clear_all()
    return {
        "status": "cleared" if success else "failed",
        "total_chunks": vector_store.get_stats()["total_chunks"]
    }

@app.post("/api/ai/seed-documents")
async def trigger_seed():
    result = seed_sample_policies()
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
