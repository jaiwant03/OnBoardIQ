from agents.state import AgentState
from rag.retriever import retrieve_verified_context
from utils.llm_client import call_ollama

def hr_agent_node(state: AgentState) -> AgentState:
    """
    Specialized HR Agent: Handles leave policies, benefits, employee rules,
    working hours, stipends, and company code of conduct.
    """
    query = state["query"]
    context, sources, confidence = retrieve_verified_context(query, department="HR", top_k=3)

    if not context or confidence == "None":
        # Check if General handbook has info
        context, sources, confidence = retrieve_verified_context(query, department="General", top_k=3)

    if not context or not sources:
        state["response"] = "I couldn't find reliable information about this in the available company documents. Please check with your HR representative or consult the official HR portal."
        state["sources"] = []
        state["confidence"] = "None"
        state["is_verified"] = False
        state["reasoning"] = "No relevant HR policies or handbook clauses matched the query in ChromaDB."
        return state

    system_prompt = (
        "You are the OnboardIQ Enterprise HR Agent. Your responsibility is to answer the employee's HR question "
        "ACCURATELY and FACTUALLY based ONLY on the provided verified company documents. "
        "Strictly adhere to the facts in the text. Do not make up or assume policies. "
        "If the answer is not clearly present in the verified context, reply: "
        "'I couldn't find reliable information about this in the available company documents.' "
        "Cite numbers, days, and rules precisely as stated in the sources."
    )

    user_prompt = f"""
Employee Question: {query}

Verified Company Policy Context:
{context}

Provide a concise, direct, and helpful answer for the employee based strictly on the verified documents above.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.1)

    # Fallback if Ollama response indicates service offline or times out
    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        # Synthesize an extractive answer directly from top snippet to ensure zero downtime
        top_snippet = sources[0]["snippet"]
        response = f"According to {sources[0]['document']} ({sources[0]['section']}):\n\n{top_snippet}"

    state["response"] = response
    state["sources"] = sources
    state["confidence"] = confidence
    state["is_verified"] = True
    state["reasoning"] = f"Resolved via HR Agent with {len(sources)} verified source citation(s)."
    return state
