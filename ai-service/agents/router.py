import re
from agents.state import AgentState

def route_intent(state: AgentState) -> AgentState:
    """
    Classifies user intent and routes to the specialized agent:
    - hr_agent: HR policies, leaves, benefits, hours, handbook, rules
    - it_agent: Software, tools, setup, VPN, git, accounts, hardware, security
    - learning_agent: Training, courses, skills, learning paths
    - onboarding_agent: Tasks, milestones, next best action, progress, state tracking

    Also handles context resolution for follow-up queries ('Why?', 'Tell me more')
    by checking previous turns in conversation_history.
    """
    raw_query = (state.get("query") or "").strip()
    query = raw_query.lower()
    history = state.get("conversation_history", []) or []

    # Contextual query resolution for follow-up questions
    followup_patterns = ["why", "why?", "why is that", "explain why", "tell me more", "where is it", "how so", "can you explain", "what else"]
    is_followup = any(query == p or query.startswith(p + " ") or query.startswith(p + "?") for p in followup_patterns)

    last_assistant_msg = ""
    for msg in reversed(history):
        if msg.get("sender") == "assistant":
            last_assistant_msg = msg.get("text", "")
            break

    # If it's a follow-up like "why?", combine it with the previous context so agents and retrievers understand
    effective_query = query
    if is_followup and last_assistant_msg:
        effective_query = f"{query} Regarding previous response: {last_assistant_msg[:200]}"
        # If the last response was about onboarding tasks / next action, keep in onboarding agent
        lower_last = last_assistant_msg.lower()
        if any(w in lower_last for w in ["next best action", "priority", "task", "milestone", "day 1", "day 2", "security training", "setup"]):
            state["intent"] = "onboarding_followup"
            state["assigned_agent"] = "onboarding_agent"
            state["tools_used"] = ["context_resolver"]
            return state

    # Keyword patterns for robust routing
    it_keywords = [
        "software", "install", "setup", "git", "github", "docker", "vscode",
        "ide", "python", "node", "npm", "vpn", "password", "1password", "hardware",
        "laptop", "ssh", "key", "tools", "access", "credentials", "jumpcloud", "okta",
        "security", "mfa", "phishing", "wireguard", "compliance", "authenticator", "firewall",
        "security training", "why do i need security training",
        "technology", "technologies", "tech stack", "tech", "stack", "frontend", "backend",
        "database", "databases", "engineering", "framework", "frameworks", "languages",
        "programming", "devops", "cloud", "aws", "react", "fastapi", "rest api", "apis",
        "code", "coding"
    ]
    
    hr_keywords = [
        "leave", "vacation", "sick", "annual leave", "maternity", "paternity",
        "holiday", "holidays", "benefit", "benefits", "insurance", "handbook",
        "hours", "work hours", "working hours", "dress code", "remote", "hybrid",
        "reimburse", "stipend", "policy", "policies", "rules", "hr", "payroll", "bereavement"
    ]
    
    learning_keywords = [
        "learn", "learning", "course", "courses", "training", "skill", "skills",
        "certif", "tutorial", "architecture", "study", "curriculum", "what should i learn"
    ]
    
    onboarding_keywords = [
        "task", "tasks", "next", "action", "progress", "day 1", "day 2", "day 3",
        "roadmap", "pending", "complete", "milestone", "overdue", "todo", "checklist",
        "what should i do", "what should i do next", "today", "finish", "what do i do next"
    ]

    # Evaluate matches
    it_score = sum(1 for k in it_keywords if k in query)
    hr_score = sum(1 for k in hr_keywords if k in query)
    learn_score = sum(1 for k in learning_keywords if k in query)
    onboard_score = sum(1 for k in onboarding_keywords if k in query)

    # Specific prioritization
    if any(k in query for k in ["technolog", "tech stack", "stack", "engineering", "frontend", "backend", "database", "devops"]):
        it_score += 4

    if "security" in query and ("policy" in query or "training" in query or "install" in query or "mfa" in query):
        it_score += 3

    if "what should i do" in query or "next best action" in query or "what should i do next" in query or "what is next" in query:
        onboard_score += 5

    if "what should i learn" in query or "what course" in query:
        learn_score += 5

    max_score = max(it_score, hr_score, learn_score, onboard_score)

    if max_score > 0:
        if max_score == onboard_score:
            assigned = "onboarding_agent"
            intent = "onboarding_inquiry"
        elif max_score == it_score:
            assigned = "it_agent"
            intent = "it_inquiry"
        elif max_score == hr_score:
            assigned = "hr_agent"
            intent = "hr_inquiry"
        else:
            assigned = "learning_agent"
            intent = "learning_inquiry"
    else:
        # Fallback heuristic
        if any(w in query for w in ["task", "today", "next", "do", "plan", "start"]):
            assigned = "onboarding_agent"
            intent = "general_onboarding_inquiry"
        elif any(w in query for w in ["tech", "code", "dev", "tool", "system", "setup", "engineer", "build"]):
            assigned = "it_agent"
            intent = "it_inquiry"
        elif any(w in query for w in ["learn", "skill", "course", "train"]):
            assigned = "learning_agent"
            intent = "learning_inquiry"
        else:
            assigned = "hr_agent"
            intent = "general_policy_inquiry"

    state["intent"] = intent
    state["assigned_agent"] = assigned
    state["tools_used"] = []
    return state
