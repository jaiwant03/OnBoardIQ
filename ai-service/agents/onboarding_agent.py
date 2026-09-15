from agents.state import AgentState
from rag.retriever import retrieve_verified_context
from utils.llm_client import call_ollama

def onboarding_agent_node(state: AgentState) -> AgentState:
    """
    Specialized Onboarding Agent: Guides employees through their roadmap,
    task prioritization, Next Best Action, and day-by-day milestones.
    """
    query = state["query"]
    name = state.get("user_name", "Team Member")
    role = state.get("user_role", "Software Developer")
    experience = state.get("user_experience", "Fresher")

    context, sources, confidence = retrieve_verified_context(
        query,
        department="General",
        top_k=2
    )

    system_prompt = (
        f"You are the OnboardIQ Onboarding Roadmap Agent. Your mission is to proactively guide {name} "
        f"({experience} {role}) through their onboarding journey. Help them prioritize high-impact onboarding tasks, "
        f"understand milestones, and highlight incomplete activities."
    )

    user_prompt = f"""
Employee Question: {query}

Employee Context:
- Name: {name}
- Role: {role}
- Level: {experience}

Reference Documentation Context:
{context if context else 'Standard onboarding roadmap includes Day 1 HR & Workstation setup, Day 2 Git & Security, Day 3 Architecture & Project deep-dive.'}

Provide a proactive, organized response guiding the employee on what to prioritize right now and why.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.2)

    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        response = (
            f"Welcome, {name}! For your onboarding as a {role}:\n\n"
            f"• Priority 1: Complete Security Awareness Training & configure Multi-Factor Authentication (MFA).\n"
            f"• Priority 2: Set up your local developer environment (Node.js, Python, Git SSH keys).\n"
            f"• Priority 3: Review the Engineering Guidelines and review your first architectural walkthrough.\n\n"
            f"Check your 'Tasks' tab to mark items as in-progress or completed!"
        )

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence if sources else "Medium"
    state["is_verified"] = bool(sources)
    state["reasoning"] = f"Actionable onboarding roadmap synthesized by Onboarding Agent for {role} ({len(sources)} verified sources)."
    return state
