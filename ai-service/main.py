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

# Startup event to auto-seed initial policies
@app.on_event("startup")
async def on_startup():
    print("[OnboardIQ AI Service] Starting up...")
    stats = vector_store.get_stats()
    if stats["total_chunks"] == 0:
        print("[OnboardIQ AI Service] ChromaDB is empty. Seeding initial company policies...")
        seed_sample_policies()
    else:
        print(f"[OnboardIQ AI Service] ChromaDB initialized with {stats['total_chunks']} chunks.")

# Request Models
class ChatRequest(BaseModel):
    query: str
    user_name: Optional[str] = "Employee"
    user_role: Optional[str] = "Software Developer"
    user_department: Optional[str] = "Engineering"
    user_experience: Optional[str] = "Fresher"
    conversation_history: Optional[List[Dict[str, str]]] = []

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
        "intent": None,
        "assigned_agent": None,
        "context": None,
        "sources": [],
        "confidence": "Medium",
        "reasoning": None,
        "response": None,
        "is_verified": False
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
            "is_verified": final_state.get("is_verified", True)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent workflow error: {str(e)}")

@app.post("/api/ai/onboarding-plan")
async def generate_onboarding_plan(req: PlanRequest):
    """
    Generates customized day-by-day onboarding roadmap based on role,
    experience level, department, and skills.
    """
    # Pre-crafted dynamic plans for common profiles with fallback
    role = req.role or "Software Developer"
    level = req.experience or "Fresher"

    tasks = [
        # Day 1: Foundation & Setup
        {
            "dayNumber": 1,
            "title": "Complete HR Registration & Portal Verification",
            "description": "Upload ID proof, emergency contacts, and complete tax verification in the HR portal.",
            "category": "HR",
            "priority": "high",
            "status": "completed",
            "estimatedMinutes": 30
        },
        {
            "dayNumber": 1,
            "title": "Review Employee Handbook & Policies",
            "description": "Read core company values, attendance rules, and communication etiquette.",
            "category": "HR",
            "priority": "medium",
            "status": "completed",
            "estimatedMinutes": 45
        },
        {
            "dayNumber": 1,
            "title": "Configure Company Email & Slack Workspace",
            "description": "Set up Google Workspace/Outlook, join #general, #announcements, and your department channel.",
            "category": "IT",
            "priority": "high",
            "status": "completed",
            "estimatedMinutes": 30
        },
        {
            "dayNumber": 1,
            "title": f"Install Developer Tooling for {role}",
            "description": "Install Node.js, Python, Docker, Git CLI, and Visual Studio Code with standard extensions.",
            "category": "IT",
            "priority": "high",
            "status": "in_progress",
            "estimatedMinutes": 60
        },
        # Day 2: Security & Workflow
        {
            "dayNumber": 2,
            "title": "Configure Enterprise Git & SSH Key Signing",
            "description": "Generate Ed25519 SSH keys, configure corporate Git profile, and request repo access.",
            "category": "IT",
            "priority": "high",
            "status": "in_progress",
            "estimatedMinutes": 45
        },
        {
            "dayNumber": 2,
            "title": "Complete Security Awareness Training & MFA Setup",
            "description": "Configure authenticator app (1Password/Google Authenticator) and complete phishing simulator.",
            "category": "Security",
            "priority": "high",
            "status": "not_started",
            "estimatedMinutes": 40
        },
        {
            "dayNumber": 2,
            "title": "Review Engineering Development Guidelines",
            "description": "Understand PR review checklist, branch naming standards, and CI/CD pipelines.",
            "category": "Engineering",
            "priority": "medium",
            "status": "not_started",
            "estimatedMinutes": 50
        },
        # Day 3: Architecture & Deep Dive
        {
            "dayNumber": 3,
            "title": "Understand Project Architecture & Services",
            "description": "Explore frontend Vite app, Node.js backend services, and Python LangGraph multi-agent pipeline.",
            "category": "Engineering",
            "priority": "high",
            "status": "not_started",
            "estimatedMinutes": 90
        },
        {
            "dayNumber": 3,
            "title": "Run Local Services & Verify ChromaDB RAG",
            "description": "Clone repositories, launch backend and AI services, and execute initial smoke test query.",
            "category": "Engineering",
            "priority": "high",
            "status": "not_started",
            "estimatedMinutes": 60
        },
        # Day 4: 1-on-1 & Starter Issue
        {
            "dayNumber": 4,
            "title": "Schedule 1-on-1 with Engineering Mentor",
            "description": "Discuss sprint goals, team ceremonies, and align on initial starter ticket expectations.",
            "category": "Training",
            "priority": "medium",
            "status": "not_started",
            "estimatedMinutes": 30
        },
        {
            "dayNumber": 4,
            "title": "Pick Up First 'Good First Issue' Starter Ticket",
            "description": "Create a feature branch, implement minor enhancement or test case, and submit your first PR.",
            "category": "Engineering",
            "priority": "medium",
            "status": "not_started",
            "estimatedMinutes": 120
        },
        # Day 5: Graduation & Review
        {
            "dayNumber": 5,
            "title": "Complete First Week Onboarding Retrospective",
            "description": "Review progress metrics, complete the onboarding feedback survey, and meet with HR.",
            "category": "HR",
            "priority": "low",
            "status": "not_started",
            "estimatedMinutes": 30
        }
    ]

    return {"role": role, "experience": level, "tasks": tasks}

@app.post("/api/ai/next-action")
async def get_next_best_action(req: NextActionRequest):
    """
    Intelligently determines the single highest-priority Next Best Action
    along with contextual reasoning why the employee should do this now.
    """
    pending = req.pending_tasks
    if not pending:
        return {
            "task_title": "All Onboarding Milestones Complete! 🎉",
            "reason": "You have accomplished all foundational onboarding tasks. Check with your team lead for sprint assignments.",
            "priority": "low",
            "category": "General",
            "progress_percentage": 100.0
        }

    # Find highest priority uncompleted task
    # Sort by: in_progress first, then high priority, then earlier day
    def task_sort_key(t):
        status_weight = 0 if t.get("status") == "in_progress" else 1
        prio_map = {"high": 0, "medium": 1, "low": 2}
        prio_weight = prio_map.get(t.get("priority", "medium"), 1)
        day_weight = t.get("dayNumber", 99)
        return (status_weight, prio_weight, day_weight)

    sorted_tasks = sorted(pending, key=task_sort_key)
    top_task = sorted_tasks[0]

    # Reasoning generation
    title = top_task.get("title", "")
    category = top_task.get("category", "")
    
    if "security" in title.lower() or "mfa" in title.lower():
        reason = "Mandatory security policy requirement. Must be completed within your first 48 hours before staging and production access keys can be granted."
    elif "git" in title.lower() or "ssh" in title.lower():
        reason = "Required to authenticate with corporate repositories and begin opening Pull Requests."
    elif "tooling" in title.lower() or "install" in title.lower():
        reason = "Essential workstation dependency needed before you can run and test the application locally."
    elif "architecture" in title.lower() or "project" in title.lower():
        reason = "Foundational knowledge required before you can effectively take on your first sprint ticket."
    elif "handbook" in title.lower() or "policy" in title.lower():
        reason = "Important company guidelines regarding communication, hours, and employee benefits."
    else:
        reason = f"Identified as the highest priority pending milestone in your Day {top_task.get('dayNumber', 1)} checklist."

    return {
        "task_id": str(top_task.get("_id", top_task.get("id", ""))),
        "task_title": title,
        "reason": reason,
        "priority": top_task.get("priority", "high"),
        "category": category,
        "dayNumber": top_task.get("dayNumber", 1),
        "status": top_task.get("status", "not_started")
    }

@app.post("/api/ai/learning-path")
async def generate_learning_path(req: PlanRequest):
    """
    Generates a 4-stage personalized learning roadmap:
    Foundation -> Current -> Next -> Upcoming
    """
    role = req.role or "Software Developer"

    stages = [
        {
            "stage": "foundation",
            "stageLabel": "FOUNDATION",
            "status": "completed",
            "title": "Git Basics & Development Environment",
            "description": "Mastering local dev tools, corporate Git workflow, branch hygiene, and terminal tooling.",
            "estimatedHours": 8,
            "modules": [
                {"title": "Local Environment Setup (Node.js & Python)", "completed": True},
                {"title": "Git & SSH Key Signing", "completed": True},
                {"title": "Company Code Formatting & Linters", "completed": True}
            ]
        },
        {
            "stage": "current",
            "stageLabel": "CURRENT",
            "status": "in_progress",
            "title": "Company Development Workflow & CI/CD",
            "description": "Understanding branch protection, Pull Request lifecycle, GitHub Actions, and containerized testing.",
            "estimatedHours": 12,
            "modules": [
                {"title": "Conventional Commits & PR Etiquette", "completed": True},
                {"title": "Docker Local Container Stacks", "completed": False},
                {"title": "Automated Testing & Lint Checks", "completed": False}
            ]
        },
        {
            "stage": "next",
            "stageLabel": "NEXT",
            "status": "upcoming",
            "title": "Full-Stack Microservices & AI RAG Pipeline",
            "description": "Deep-dive into LangGraph multi-agent orchestration, ChromaDB vector indexing, and Express REST APIs.",
            "estimatedHours": 16,
            "modules": [
                {"title": "Node.js REST Services & JWT Auth", "completed": False},
                {"title": "LangGraph StateGraph & Node Routing", "completed": False},
                {"title": "ChromaDB Semantic Search & Source Verification", "completed": False}
            ]
        },
        {
            "stage": "upcoming",
            "stageLabel": "UPCOMING",
            "status": "locked",
            "title": "Production Deployment & Observability",
            "description": "Zero-downtime releases, metrics monitoring, structured JSON logging, and incident response.",
            "estimatedHours": 10,
            "modules": [
                {"title": "Staging vs Production Deployment Cycle", "completed": False},
                {"title": "Service Health Monitoring & Grafana", "completed": False},
                {"title": "Production Security Compliance", "completed": False}
            ]
        }
    ]

    return {"role": role, "stages": stages}

@app.post("/api/ai/index-document")
async def index_document(req: IndexDocumentRequest):
    """
    Extracts text from file (or accepts raw text), chunks it, and indexes into ChromaDB.
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

        return {
            "status": "indexed",
            "filename": req.filename,
            "chunks_indexed": chunks_indexed,
            "total_collection_chunks": vector_store.get_stats()["total_chunks"]
        }
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@app.post("/api/ai/seed-documents")
async def trigger_seed():
    result = seed_sample_policies()
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
