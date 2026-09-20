import re
import json
from typing import Dict, Any, List
from utils.llm_client import call_ollama

def clean_json_string(text: str) -> str:
    """Extracts JSON block from potential LLM markdown response."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

def extract_heuristic_tasks_and_learning(text: str, filename: str, department: str = "General", category: str = "General") -> Dict[str, Any]:
    """
    Robust deterministic rule-based extractor that analyzes document text
    to extract actionable onboarding tasks and learning curriculum stages.
    Guarantees that uploaded documents immediately generate relevant tasks and learning paths
    even if local LLM inference is warming up or unavailable.
    """
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # 1. Identify headings and action sentences
    potential_actions = []
    action_verbs = [
        "review", "complete", "read", "configure", "install", "set up", "setup",
        "submit", "sign", "verify", "attend", "schedule", "connect", "access",
        "follow", "obtain", "familiarize", "check", "ensure", "contact"
    ]
    
    # Also find bullet points or numbered lists
    for line in lines:
        cleaned = re.sub(r"^[\d\.\-\*\•\–\—\s]+", "", line).strip()
        if len(cleaned) < 10 or len(cleaned) > 160:
            continue
        
        lower_line = cleaned.lower()
        starts_with_action = any(lower_line.startswith(verb) for verb in action_verbs)
        contains_action = any(f" {verb} " in lower_line for verb in action_verbs)
        is_heading = len(cleaned) < 60 and (line.isupper() or line.endswith(":") or re.match(r"^(\d+\.|\#+)", line))
        
        if starts_with_action or (is_heading and any(w in lower_line for w in ["policy", "guide", "rule", "standard", "procedure", "step", "requirement"])) or contains_action:
            if cleaned not in potential_actions:
                potential_actions.append(cleaned)

    # If few specific actions found, extract meaningful sections or sentences
    if len(potential_actions) < 4:
        for line in lines:
            cleaned = re.sub(r"^[\d\.\-\*\•\–\—\s]+", "", line).strip()
            if 20 <= len(cleaned) <= 120 and cleaned not in potential_actions:
                potential_actions.append(cleaned)
            if len(potential_actions) >= 8:
                break

    # Categorize based on keywords
    def detect_category(txt: str) -> str:
        low = txt.lower()
        if any(w in low for w in ["security", "password", "mfa", "auth", "vpn", "confidential", "compliance"]):
            return "Security"
        if any(w in low for w in ["install", "laptop", "software", "hardware", "tool", "email", "slack", "git", "ssh", "network", "it "]):
            return "IT"
        if any(w in low for w in ["hr", "leave", "handbook", "vacation", "benefit", "payroll", "conduct", "holiday", "attendance", "culture"]):
            return "HR"
        if any(w in low for w in ["code", "develop", "api", "architecture", "test", "docker", "deploy", "repo", "pr"]):
            return "Engineering"
        if any(w in low for w in ["learn", "train", "course", "shadow", "mentor"]):
            return "Training"
        return category if category != "General" else "General"

    # Assign priorities and day numbers (stagger across Day 1 to Day 5)
    tasks = []
    total_actions = min(len(potential_actions), 10)
    
    if total_actions == 0:
        # Fallback to the document title itself
        doc_base = filename.replace(".pdf", "").replace(".docx", "").replace(".txt", "").replace("_", " ").title()
        potential_actions = [
            f"Review and acknowledge {doc_base}",
            f"Understand core procedures outlined in {doc_base}",
            f"Apply key requirements from {doc_base} to your onboarding workflow"
        ]
        total_actions = len(potential_actions)

    for idx, act in enumerate(potential_actions[:total_actions]):
        day_num = min(5, (idx // 2) + 1)
        cat = detect_category(act)
        prio = "high" if (day_num == 1 or "security" in act.lower() or "hr" in act.lower()) else "medium"
        est_min = 30 if len(act) < 50 else 45
        
        # Format clean title
        title = act
        if not any(title.lower().startswith(v) for v in action_verbs):
            title = f"Review & Apply: {title}"
        if len(title) > 80:
            title = title[:77] + "..."

        tasks.append({
            "dayNumber": day_num,
            "title": title,
            "description": f"Extracted from {filename}: {act}",
            "category": cat,
            "priority": prio,
            "status": "not_started",
            "estimatedMinutes": est_min,
            "sourceDocument": filename
        })

    # Build 4-stage learning path derived from document concepts
    doc_title = filename.replace(".pdf", "").replace(".docx", "").replace(".txt", "").replace("_", " ").title()
    
    stages = [
        {
            "stage": "foundation",
            "stageLabel": "FOUNDATION",
            "status": "in_progress",
            "title": f"Core Foundations: {doc_title}",
            "description": f"Essential policies, orientation principles, and baseline guidelines from {filename}.",
            "estimatedHours": 6,
            "modules": [
                {"title": f"Overview & Purpose of {doc_title}", "completed": False},
                {"title": "Roles, Responsibilities & Compliance Scope", "completed": False},
                {"title": "Initial Verification & Orientation Checklist", "completed": False}
            ]
        },
        {
            "stage": "current",
            "stageLabel": "CURRENT",
            "status": "upcoming",
            "title": f"Operational Workflow & Standards",
            "description": f"Practical execution, day-to-day conventions, and procedural standards detailed in {doc_title}.",
            "estimatedHours": 10,
            "modules": [
                {"title": f"Standards & Operational Guidelines ({doc_title})", "completed": False},
                {"title": "Tooling Configuration & Workspace Integration", "completed": False},
                {"title": "Team Communication & Escalation Paths", "completed": False}
            ]
        },
        {
            "stage": "next",
            "stageLabel": "NEXT",
            "status": "upcoming",
            "title": "Applied Practice & Domain Competencies",
            "description": f"Hands-on execution and collaborative delivery based on company documentation.",
            "estimatedHours": 12,
            "modules": [
                {"title": "Cross-Functional Collaboration Protocol", "completed": False},
                {"title": "Quality Assurance & Policy Adherence Verification", "completed": False}
            ]
        },
        {
            "stage": "upcoming",
            "stageLabel": "UPCOMING",
            "status": "locked",
            "title": "Continuous Mastery & Knowledge Scaling",
            "description": "Long-term efficiency, advanced compliance, and contributing back to team playbooks.",
            "estimatedHours": 8,
            "modules": [
                {"title": f"Annual Review & Refinement of {doc_title}", "completed": False},
                {"title": "Best Practices Mentorship & Scaling", "completed": False}
            ]
        }
    ]

    return {
        "tasks": tasks,
        "learning_path": {
            "stages": stages
        }
    }

def extract_onboarding_data_from_document(text: str, filename: str, department: str = "General", category: str = "General") -> Dict[str, Any]:
    """
    Primary extraction entry point.
    First tries Ollama LLM to dynamically generate deep contextual tasks and learning stages.
    Falls back instantly to deterministic heuristic extraction if LLM is unavailable.
    """
    # Sample up to first 4500 characters of the document for LLM prompt
    preview_text = text[:4500]
    
    prompt = f"""You are an autonomous AI onboarding architect. Analyze this company document and extract:
1. "tasks": 4 to 8 actionable, realistic onboarding tasks for a new hire to complete.
Each task must have:
  - "dayNumber": integer from 1 to 5
  - "title": concise action-oriented title (e.g. "Review Leave Request Procedure")
  - "description": brief instruction explaining what the employee needs to do based on the document
  - "category": one of ["HR", "IT", "Security", "Engineering", "Training", "General"]
  - "priority": one of ["high", "medium", "low"]
  - "status": "not_started"
  - "estimatedMinutes": integer (15, 30, 45, or 60)
  - "sourceDocument": "{filename}"

2. "learning_path": a 4-stage curriculum with "stages":
  Each stage must have:
    - "stage": one of ["foundation", "current", "next", "upcoming"]
    - "stageLabel": ["FOUNDATION", "CURRENT", "NEXT", "UPCOMING"]
    - "status": first stage "in_progress", others "upcoming" or "locked"
    - "title": stage title reflecting document themes
    - "description": stage summary
    - "estimatedHours": integer
    - "modules": list of 2-3 items with {{"title": str, "completed": false}}

Return ONLY valid raw JSON with keys "tasks" and "learning_path". Do NOT include markdown code fences or conversational text.

Document Name: {filename}
Department: {department}
Document Content:
{preview_text}
"""

    llm_response = call_ollama(prompt, temperature=0.1, timeout=12)
    if llm_response:
        try:
            cleaned = clean_json_string(llm_response)
            data = json.loads(cleaned)
            if "tasks" in data and isinstance(data["tasks"], list) and len(data["tasks"]) > 0:
                # Ensure all tasks have sourceDocument
                for t in data["tasks"]:
                    t["sourceDocument"] = filename
                    if "status" not in t:
                        t["status"] = "not_started"
                return data
        except Exception as err:
            print(f"[DocumentExtractor] Failed to parse LLM JSON response ({err}), using heuristic extractor.")

    # Heuristic fallback
    return extract_heuristic_tasks_and_learning(text, filename, department, category)
