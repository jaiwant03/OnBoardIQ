import re
from agents.state import AgentState

def route_intent(state: AgentState) -> AgentState:
    """
    Classifies user intent and routes to the specialized agent:
    - hr_agent: HR policies, leaves, benefits, hours, handbook, rules
    - it_agent: Software, tools, setup, VPN, git, accounts, hardware
    - learning_agent: Training, courses, skills, learning paths
    - onboarding_agent: Tasks, milestones, next best action, progress
    """
    query = (state.get("query") or "").lower()

    # Keyword patterns for fast, robust routing
    it_keywords = [
        "software", "install", "setup", "git", "github", "docker", "vscode",
        "ide", "python", "node", "npm", "vpn", "password", "1password", "hardware",
        "laptop", "ssh", "key", "tools", "access", "credentials", "jumpcloud", "okta"
    ]
    
    hr_keywords = [
        "leave", "vacation", "sick", "annual leave", "maternity", "paternity",
        "holiday", "holidays", "benefit", "benefits", "insurance", "handbook",
        "hours", "work hours", "working hours", "dress code", "remote", "hybrid",
        "reimburse", "stipend", "policy", "policies", "rules", "hr", "payroll", "bereavement"
    ]
    
    learning_keywords = [
        "learn", "learning", "course", "courses", "training", "skill", "skills",
        "certif", "tutorial", "architecture", "study", "curriculum"
    ]
    
    onboarding_keywords = [
        "task", "tasks", "next", "action", "progress", "day 1", "day 2", "day 3",
        "roadmap", "pending", "complete", "milestone", "overdue", "todo", "checklist", "what should i do"
    ]

    # Evaluate matches
    it_score = sum(1 for k in it_keywords if k in query)
    hr_score = sum(1 for k in hr_keywords if k in query)
    learn_score = sum(1 for k in learning_keywords if k in query)
    onboard_score = sum(1 for k in onboarding_keywords if k in query)

    max_score = max(it_score, hr_score, learn_score, onboard_score)

    if max_score > 0:
        if max_score == hr_score:
            assigned = "hr_agent"
            intent = "hr_inquiry"
        elif max_score == it_score:
            assigned = "it_agent"
            intent = "it_inquiry"
        elif max_score == onboard_score:
            assigned = "onboarding_agent"
            intent = "onboarding_inquiry"
        else:
            assigned = "learning_agent"
            intent = "learning_inquiry"
    else:
        # Default based on query style
        if any(w in query for w in ["how", "what", "policy", "who"]):
            assigned = "hr_agent"
            intent = "general_policy_inquiry"
        else:
            assigned = "onboarding_agent"
            intent = "general_onboarding_inquiry"

    state["intent"] = intent
    state["assigned_agent"] = assigned
    return state
