"""
OnboardIQ Agent Tools Module
Provides structured tools that LangGraph agents use to access application state,
perform vector retrieval, reason about task dependencies, and personalize recommendations.
"""

from typing import Dict, Any, List, Tuple
from rag.retriever import retrieve_verified_context
from utils.llm_client import call_ollama

def search_company_knowledge(query: str, department: str = "General", top_k: int = 3) -> Tuple[str, List[Dict[str, Any]], str]:
    """
    RAG Tool: Searches the ChromaDB vector store for verified company policy or IT chunks.
    Returns: (formatted_context, sources_list, confidence_level)
    """
    return retrieve_verified_context(query=query, department=department, top_k=top_k)

def get_employee_profile(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    State Tool: Retrieves the employee's role, department, experience, and skills from state.
    """
    return {
        "name": state.get("user_name", "Employee"),
        "role": state.get("user_role", "Software Developer"),
        "department": state.get("user_department", "Engineering"),
        "experience": state.get("user_experience", "Fresher"),
        "skills": state.get("skills", []),
        "progress_percentage": state.get("progress_percentage", 0.0)
    }

def get_onboarding_status(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    State Tool: Examines the employee's completed vs pending onboarding tasks.
    """
    completed = state.get("completed_tasks", []) or []
    pending = state.get("pending_tasks", []) or []
    total = len(completed) + len(pending)
    percent = state.get("progress_percentage", 0.0)
    if total > 0:
        percent = round((len(completed) / total) * 100, 1)

    return {
        "completed_count": len(completed),
        "pending_count": len(pending),
        "total_tasks": total,
        "progress_percentage": percent,
        "completed_task_titles": completed,
        "pending_tasks": pending
    }

def evaluate_next_best_action(
    pending_tasks: List[Dict[str, Any]], 
    completed_tasks: List[str], 
    role: str = "Software Developer", 
    department: str = "Engineering"
) -> Dict[str, Any]:
    """
    Reasoning Tool: Analyzes pending tasks, dependencies, and employee context
    using the LLM to determine the single highest priority Next Best Action with explanation.
    """
    if not pending_tasks:
        return {
            "task_title": "All Onboarding Milestones Complete! 🎉",
            "reason": "You have completed all foundational tasks for your role. Coordinate with your manager for team sprint work.",
            "priority": "low",
            "category": "General",
            "status": "completed"
        }

    # Deterministic sorting heuristic: in_progress first, then high priority, then earlier day
    def task_sort_key(t):
        status_weight = 0 if t.get("status") == "in_progress" else 1
        prio_map = {"high": 0, "medium": 1, "low": 2}
        prio_weight = prio_map.get(t.get("priority", "medium"), 1)
        day_weight = t.get("dayNumber", 99)
        return (status_weight, prio_weight, day_weight)

    sorted_tasks = sorted(pending_tasks, key=task_sort_key)
    top_task = sorted_tasks[0]
    task_title = top_task.get("title", "")
    task_category = top_task.get("category", "General")
    task_day = top_task.get("dayNumber", 1)

    # Use LLM to generate reasoned explanation why this task is the next recommended action
    prompt = f"""
Analyze this employee's onboarding progress and explain concisely WHY this specific task is recommended as the NEXT BEST ACTION:

Employee Role: {role} in {department}
Completed Tasks: {', '.join(completed_tasks) if completed_tasks else 'None so far'}
Recommended Next Task: "{task_title}" (Category: {task_category}, Day {task_day})
All Pending Tasks: {', '.join([t.get('title', '') for t in sorted_tasks[:4]])}

Instructions:
Provide a concise, professional 1-2 sentence explanation of why the employee should do this task next.
Focus on dependencies, safety, policy requirements, or practical workflow prerequisites.
Do NOT output markdown headers. Just provide the concise explanation.
"""

    system_prompt = (
        "You are the OnboardIQ Autonomous Reasoning Engine. Explain why a recommended onboarding task is the next best step."
    )

    reason = call_ollama(prompt=prompt, system_prompt=system_prompt, temperature=0.2)

    # High quality fallback if LLM is offline
    if not reason or not reason.strip() or "[AI Agent is currently unavailable" in reason:
        lower_title = task_title.lower()
        if "security" in lower_title or "mfa" in lower_title or "compliance" in lower_title:
            reason = f"Mandatory compliance milestone. Security awareness and MFA must be configured within your first 48 hours to grant corporate system access."
        elif "git" in lower_title or "ssh" in lower_title or "repo" in lower_title:
            reason = f"Essential technical setup required before you can clone internal repositories and open code pull requests."
        elif "handbook" in lower_title or "hr" in lower_title:
            reason = f"Foundational orientation task to familiarize you with company leave policies, work hours, and workplace standards."
        elif "environment" in lower_title or "tool" in lower_title or "install" in lower_title:
            reason = f"Core workstation prerequisite required before you can run and verify application code locally."
        else:
            reason = f"Top-priority pending milestone in your Day {task_day} schedule needed to maintain steady onboarding momentum."

    return {
        "task_id": str(top_task.get("_id", top_task.get("id", ""))),
        "task_title": task_title,
        "reason": reason.strip().strip('"'),
        "priority": top_task.get("priority", "high"),
        "category": task_category,
        "dayNumber": task_day,
        "status": top_task.get("status", "not_started")
    }
