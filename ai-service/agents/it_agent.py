from agents.state import AgentState
from rag.retriever import retrieve_verified_context
from utils.llm_client import call_ollama

def it_agent_node(state: AgentState) -> AgentState:
    """
    Specialized IT & Security Agent: Handles software installations,
    account setup, Git, Docker, VPN, MFA, and developer environments.
    """
    query = state["query"]
    context, sources, confidence = retrieve_verified_context(query, department="IT", top_k=3)

    if not context or len(sources) == 0:
        # Check Security or Engineering documents
        context, sources, confidence = retrieve_verified_context(query, department="Security", top_k=3)
        if not context or len(sources) == 0:
            context, sources, confidence = retrieve_verified_context(query, department="Engineering", top_k=3)

    if not context or not sources:
        state["response"] = "I couldn't find this information in the available company documents. Please contact the IT Helpdesk via Slack (#it-support) or open a ticket at helpdesk.internal."
        state["sources"] = []
        state["confidence"] = "Low"
        state["is_verified"] = False
        state["reasoning"] = "No matching IT guide or security documentation found in ChromaDB."
        return state

    system_prompt = (
        "You are the OnboardIQ Enterprise IT & Security Agent. Guide the employee through required software, "
        "developer tooling, setup procedures, and security protocols strictly using the company documentation provided. "
        "Be structured, actionable, and state any mandatory steps clearly."
    )

    user_prompt = f"""
Employee Question: {query}
Employee Role: {state.get('user_role', 'Employee')}

Verified Company IT & Security Context:
{context}

Provide a clear, step-by-step or structured guide based strictly on the verified documents above.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.1)

    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        top_snippet = sources[0]["snippet"]
        response = f"Based on {sources[0]['document']} ({sources[0]['section']}):\n\n{top_snippet}"

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence
    state["is_verified"] = True
    state["reasoning"] = f"Resolved via IT Agent with {len(sources)} verified source citation(s)."
    return state
