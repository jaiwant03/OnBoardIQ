from agents.state import AgentState
from agents.tools import search_company_knowledge
from utils.llm_client import call_ollama

def it_agent_node(state: AgentState) -> AgentState:
    """
    Specialized IT & Security Agent: Handles software installations,
    account setup, Git, Docker, VPN, MFA, and developer environments.
    """
    query = state["query"]
    tools_used = state.get("tools_used", []) or []

    recent_history_str = ""
    for msg in (state.get("conversation_history") or [])[-4:]:
        recent_history_str += f"{msg.get('sender', 'user').capitalize()}: {msg.get('text', '')}\n"

    search_q = query
    if len(query.split()) <= 3 and recent_history_str:
        search_q = f"{recent_history_str.splitlines()[-1]} {query}"

    context, sources, confidence = search_company_knowledge(search_q, department="IT", top_k=3)
    tools_used.append("search_company_knowledge")

    if not context or len(sources) == 0:
        # Check Security or Engineering documents
        context, sources, confidence = search_company_knowledge(search_q, department="Security", top_k=3)
        if not context or len(sources) == 0:
            context, sources, confidence = search_company_knowledge(search_q, department="Engineering", top_k=3)

    if not context or not sources or confidence == "None":
        state["response"] = "I couldn't find reliable information about this in the available company documents. Please contact the IT Helpdesk via Slack (#it-support) or open a ticket at helpdesk.internal."
        state["sources"] = []
        state["confidence"] = "None"
        state["is_verified"] = False
        state["reasoning"] = "No matching IT guide or security documentation found in ChromaDB."
        state["tools_used"] = list(set(tools_used))
        return state

    system_prompt = (
        "You are the OnboardIQ Enterprise IT & Security Agent. Guide the employee through required software, "
        "developer tooling, setup procedures, and security protocols strictly using the company documentation provided. "
        "Be structured, actionable, and state any mandatory steps clearly. "
        "If the information is not present in the provided context, respond with: "
        "'I couldn't find reliable information about this in the available company documents.'"
    )

    user_prompt = f"""
Employee Question: {query}
Employee Role: {state.get('user_role', 'Employee')}

Recent Conversation History:
{recent_history_str if recent_history_str else 'None'}

Verified Company IT & Security Context:
{context}

Provide a clear, step-by-step or structured guide based strictly on the verified documents above.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.1)

    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        top_snippet = sources[0]["snippet"]
        response = f"Based on {sources[0]['document']} ({sources[0]['section']}):\n\n{top_snippet}"

    # If the model indicates the policy or tool is missing from the documents
    lower_resp = (response or "").lower()
    if any(phrase in lower_resp for phrase in ["couldn't find", "could not find", "do not address", "does not contain", "not mentioned", "not provided", "no information"]):
        state["response"] = response
        state["sources"] = []
        state["confidence"] = "None"
        state["is_verified"] = False
        state["reasoning"] = "Query not found in indexed IT/Security documentation."
        state["tools_used"] = list(set(tools_used))
        return state

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence
    state["is_verified"] = True
    state["reasoning"] = f"Resolved via IT Agent with {len(sources)} verified source citation(s) from ChromaDB."
    state["tools_used"] = list(set(tools_used))
    return state
