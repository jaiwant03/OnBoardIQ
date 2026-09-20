from agents.state import AgentState
from agents.tools import get_employee_profile, get_onboarding_status, evaluate_next_best_action, search_company_knowledge
from utils.llm_client import call_ollama

def onboarding_agent_node(state: AgentState) -> AgentState:
    """
    Autonomous Onboarding Agent:
    - Observes employee's current onboarding task state from database.
    - Evaluates completed vs pending tasks.
    - Determines Next Best Action with reasoned justification.
    - Explains task dependencies and roadmap milestones.
    """
    query = state["query"]
    profile = get_employee_profile(state)
    status = get_onboarding_status(state)
    name = profile["name"]
    role = profile["role"]
    experience = profile["experience"]
    completed = status["completed_task_titles"]
    pending = status["pending_tasks"]
    progress_pct = status["progress_percentage"]
    tools_used = state.get("tools_used", []) or []

    # Record tool usage
    tools_used.extend(["get_employee_profile", "get_onboarding_status"])

    # 1. Retrieve any relevant knowledge from vector store
    context, sources, confidence = search_company_knowledge(query, department="General", top_k=2)
    if sources:
        tools_used.append("search_company_knowledge")

    # 2. Check if this is a Next Action inquiry or Followup
    lower_query = query.lower()
    is_next_action = any(w in lower_query for w in ["what should i do", "next", "what do i do next", "action", "today", "milestone", "priority", "task"])
    is_why_followup = any(w in lower_query for w in ["why", "why?", "explain why", "reason"])

    # If pending tasks exist, evaluate the Next Best Action tool
    next_action = None
    if pending:
        next_action = evaluate_next_best_action(
            pending_tasks=pending,
            completed_tasks=completed,
            role=role,
            department=profile["department"]
        )
        tools_used.append("evaluate_next_best_action")

    # Build conversation context from history
    recent_history_str = ""
    for msg in (state.get("conversation_history") or [])[-4:]:
        recent_history_str += f"{msg.get('sender', 'user').capitalize()}: {msg.get('text', '')}\n"

    system_prompt = (
        f"You are OnboardIQ's Autonomous Onboarding Agent. You guide {name} ({experience} {role}) "
        f"through their onboarding tasks and milestones. "
        f"You must base your advice directly on their actual onboarding state: "
        f"Completed tasks: {len(completed)}, Pending tasks: {len(pending)}, Progress: {progress_pct}%.\n"
        f"Be direct, encouraging, and provide clear reasoning for task priorities."
    )

    state_summary = f"""
Current Employee State:
- Role: {role} ({experience}) in {profile['department']}
- Progress: {progress_pct}% completed ({len(completed)} completed, {len(pending)} pending)
- Completed Tasks: {', '.join(completed) if completed else 'None'}
- Recommended Next Task: {next_action['task_title'] if next_action else 'All tasks complete'}
- Next Task Reason: {next_action['reason'] if next_action else 'N/A'}
- All Pending Tasks: {', '.join([t.get('title', '') for t in pending[:5]]) if pending else 'None'}
"""

    user_prompt = f"""
{state_summary}

Recent Conversation History:
{recent_history_str}

Employee Question: {query}

Relevant Reference Context:
{context if context else 'Standard onboarding policy: Complete HR & security requirements in Day 1-2, followed by technical setup and team integration.'}

Instructions:
Answer the employee's question directly using their actual onboarding progress.
If they ask what to do next, clearly highlight the Recommended Next Task and explain WHY.
If they ask 'why', explain the reasoning and prerequisites clearly based on their state.
Keep your response concise, structured, and professional.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.2)

    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        if next_action and pending:
            response = (
                f"Based on your current onboarding state ({progress_pct}% complete):\n\n"
                f"🎯 **Next Best Action:** {next_action['task_title']}\n\n"
                f"**Why this is recommended:** {next_action['reason']}\n\n"
                f"You have completed {len(completed)} task(s) so far ({', '.join(completed[:2])}). "
                f"Completing '{next_action['task_title']}' is the next critical milestone for your role as {role}."
            )
        elif not pending and completed:
            response = f"🎉 Great job, {name}! You have completed all {len(completed)} onboarding tasks assigned to you. Coordinate with your team lead for next sprint items!"
        else:
            response = (
                f"Welcome, {name}! No active onboarding tasks have been assigned yet. "
                f"Once company onboarding documents are uploaded, personalized tasks and milestones will appear automatically."
            )

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence if sources else "High"
    state["is_verified"] = bool(sources)
    state["reasoning"] = f"Resolved via Onboarding Agent using state tools: {', '.join(set(tools_used))}."
    state["tools_used"] = list(set(tools_used))
    return state
