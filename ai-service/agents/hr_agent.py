from agents.state import AgentState
from agents.tools import search_company_knowledge
from utils.llm_client import call_ollama

def hr_agent_node(state: AgentState) -> AgentState:
    """
    Specialized HR Agent: Handles leave policies, benefits, employee rules,
    working hours, stipends, and company code of conduct.
    """
    query = state["query"]
    tools_used = state.get("tools_used", []) or []

    # Format recent history for dialogue continuity
    recent_history_str = ""
    for msg in (state.get("conversation_history") or [])[-4:]:
        recent_history_str += f"{msg.get('sender', 'user').capitalize()}: {msg.get('text', '')}\n"

    # Contextual query for retrieval if query is brief
    search_q = query
    if len(query.split()) <= 3 and recent_history_str:
        search_q = f"{recent_history_str.splitlines()[-1]} {query}"

    context, sources, confidence = search_company_knowledge(search_q, department="HR", top_k=3)
    tools_used.append("search_company_knowledge")

    if not context or confidence == "None":
        # Check General handbook policies
        context, sources, confidence = search_company_knowledge(search_q, department="General", top_k=3)

    # Strict Zero-Knowledge Guard: If no relevant company policy documents match
    if not context or not sources or confidence == "None":
        state["response"] = "I couldn't find reliable information about this in the available company documents. Please check with your HR representative or consult the official HR portal."
        state["sources"] = []
        state["confidence"] = "None"
        state["is_verified"] = False
        state["reasoning"] = "No relevant HR policies or handbook clauses matched the query in ChromaDB."
        state["tools_used"] = list(set(tools_used))
        return state

    system_prompt = (
        "You are the OnboardIQ Enterprise HR Agent. Your responsibility is to answer the employee's question "
        "ACCURATELY and FACTUALLY based ONLY on the provided verified company documents. "
        "Strictly adhere to the facts in the text. Do not make up, assume, or extrapolate policies. "
        "If the specific answer is not clearly present in the verified context, reply exactly: "
        "'I couldn't find reliable information about this in the available company documents.' "
        "Cite numbers, days, and rules precisely as stated in the sources."
    )

    user_prompt = f"""
Employee Question: {query}

Recent Conversation History:
{recent_history_str if recent_history_str else 'None'}

Verified Company Policy Context:
{context}

Provide a concise, direct, and helpful answer for the employee based strictly on the verified documents above.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.1)

    # Extractive fallback if Ollama response is empty or offline
    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        top_snippet = sources[0]["snippet"]
        response = f"According to {sources[0]['document']} ({sources[0]['section']}):\n\n{top_snippet}"

    # Check if the model stated that information is missing
    lower_resp = (response or "").lower()
    if any(phrase in lower_resp for phrase in ["couldn't find", "could not find", "do not address", "does not contain", "not mentioned", "not provided", "no information"]):
        state["response"] = response
        state["sources"] = []
        state["confidence"] = "None"
        state["is_verified"] = False
        state["reasoning"] = "Query not found in indexed company documentation."
        state["tools_used"] = list(set(tools_used))
        return state

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence
    state["is_verified"] = True
    state["reasoning"] = f"Resolved via HR Agent with {len(sources)} verified source citation(s) from ChromaDB."
    state["tools_used"] = list(set(tools_used))
    return state
