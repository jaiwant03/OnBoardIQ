from agents.state import AgentState
from agents.tools import get_employee_profile, get_onboarding_status, search_company_knowledge
from utils.llm_client import call_ollama

def learning_agent_node(state: AgentState) -> AgentState:
    """
    Specialized Learning Agent:
    Recommends training courses, skill development, engineering standards,
    and adaptive learning paths based on the employee's role, experience, skills,
    and current onboarding progress.
    """
    query = state["query"]
    profile = get_employee_profile(state)
    status = get_onboarding_status(state)
    role = profile["role"]
    experience = profile["experience"]
    department = profile["department"]
    skills = profile["skills"] or []
    completed = status["completed_task_titles"]
    tools_used = state.get("tools_used", []) or []

    tools_used.extend(["get_employee_profile", "get_onboarding_status"])

    context, sources, confidence = search_company_knowledge(
        f"{query} training guidelines standards",
        department=department,
        top_k=2
    )
    if sources:
        tools_used.append("search_company_knowledge")

    recent_history_str = ""
    for msg in (state.get("conversation_history") or [])[-4:]:
        recent_history_str += f"{msg.get('sender', 'user').capitalize()}: {msg.get('text', '')}\n"

    system_prompt = (
        f"You are the OnboardIQ Learning & Skills Agent. You advise new employees on their technical learning curriculum, "
        f"skills development, and engineering best practices.\n"
        f"Employee Context:\n"
        f"- Role: {role}\n"
        f"- Experience Level: {experience}\n"
        f"- Department: {department}\n"
        f"- Current Skills: {', '.join(skills) if skills else 'General'}\n"
        f"- Completed Onboarding Milestones: {', '.join(completed) if completed else 'None yet'}\n"
        f"Provide practical, highly personalized learning recommendations tailored specifically to this employee."
    )

    user_prompt = f"""
Employee Question: {query}

Recent Conversation History:
{recent_history_str if recent_history_str else 'None'}

Internal Company Guidelines / Learning Context:
{context if context else 'Engineering practices: Git flow, PR guidelines, clean architecture, unit testing, and production deployment standards.'}

Provide an actionable, personalized learning recommendation tailored to this {experience} {role}.
Explain what topics they should prioritize first, why, and how it connects to their team's stack.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.2, num_predict=400)

    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        response = (
            f"Here is your personalized learning recommendation as a {experience} {role} in {department}:\n\n"
            f"1. **Foundations (Day 1-2):** Master the team Git branching model, PR checklist, and internal code conventions.\n"
            f"2. **Core Architecture (Week 1):** Dive into the project repository architecture, service boundaries, and data pipelines.\n"
            f"3. **Production Readiness (Week 2):** Explore CI/CD deployment pipelines, automated testing suites, and security compliance standards."
        )

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence if sources else "Medium"
    state["is_verified"] = bool(sources)
    state["reasoning"] = f"Curated by Learning Agent for {experience} {role} using profile and progress tools."
    state["tools_used"] = list(set(tools_used))
    return state
