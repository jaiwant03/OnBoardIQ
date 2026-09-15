from agents.state import AgentState
from rag.retriever import retrieve_verified_context
from utils.llm_client import call_ollama

def learning_agent_node(state: AgentState) -> AgentState:
    """
    Specialized Learning Agent: Recommends courses, skill development,
    engineering practices, and role-based training curriculums.
    """
    query = state["query"]
    role = state.get("user_role", "Software Developer")
    experience = state.get("user_experience", "Fresher")
    department = state.get("user_department", "Engineering")

    context, sources, confidence = retrieve_verified_context(
        f"{query} training guidelines",
        department=department,
        top_k=2
    )

    system_prompt = (
        f"You are the OnboardIQ Learning & Skills Agent. You advise new employees on their training curriculum, "
        f"technical skills, architecture knowledge, and continuous development at the company. "
        f"Employee Context: Role={role}, Experience={experience}, Department={department}."
    )

    user_prompt = f"""
Employee Question: {query}

Internal Company Guidelines / Learning Context:
{context if context else 'General engineering best practices, CI/CD, Git branching, and microservices architecture.'}

Provide an actionable, structured learning recommendation tailored specifically to a {experience} {role} in {department}.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.3)

    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        response = (
            f"Here is the recommended learning focus for a {experience} {role}:\n"
            f"1. Foundation: Company Git workflow, branching conventions, and local dev environments.\n"
            f"2. Architecture: Microservices, REST APIs, and ChromaDB vector store integration.\n"
            f"3. Production Readiness: Security standards, PR code review guidelines, and CI/CD automation."
        )

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence if sources else "Medium"
    state["is_verified"] = bool(sources)
    state["reasoning"] = f"Curated by Learning Agent for {experience} {role} ({len(sources)} verified sources)."
    return state
