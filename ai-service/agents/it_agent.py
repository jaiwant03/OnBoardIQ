from agents.state import AgentState
from agents.tools import search_company_knowledge
from utils.llm_client import call_ollama
from utils.fallback_synthesizer import synthesize_clean_fallback

def it_agent_node(state: AgentState) -> AgentState:
    """
    Specialized IT & Engineering Agent: Handles technology stacks, engineering standards,
    software installations, account setup, Git, Docker, VPN, MFA, and developer environments.
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

    # If IT search gave low/no confidence, or query is explicitly engineering/tech, check Engineering/General
    lower_q = query.lower()
    is_eng_query = any(k in lower_q for k in ["tech", "stack", "engineer", "frontend", "backend", "database", "ai", "cloud", "devops"])
    if not context or len(sources) == 0 or confidence == "Low" or is_eng_query:
        gen_context, gen_sources, gen_conf = search_company_knowledge(search_q, department="General", top_k=3)
        if gen_sources and (not sources or (gen_sources[0]["similarity"] > (sources[0]["similarity"] if sources else 0))):
            context, sources, confidence = gen_context, gen_sources, gen_conf
        if not context or len(sources) == 0:
            eng_context, eng_sources, eng_conf = search_company_knowledge(search_q, department="Engineering", top_k=3)
            if eng_sources:
                context, sources, confidence = eng_context, eng_sources, eng_conf

    if not context or not sources or confidence == "None":
        state["response"] = "I couldn't find reliable information about this in the available company documents. Please contact the IT Helpdesk via Slack (#it-support) or check the engineering documentation portal."
        state["sources"] = []
        state["confidence"] = "None"
        state["is_verified"] = False
        state["reasoning"] = "No matching IT guide or engineering documentation found in ChromaDB."
        state["tools_used"] = list(set(tools_used))
        return state

    system_prompt = (
        "You are the OnboardIQ Enterprise IT & Engineering Agent. Your responsibility is to answer employee "
        "questions about technology stacks, development workflows, software tooling, system access, and security practices "
        "ACCURATELY and FACTUALLY based ONLY on the provided verified company documents.\n"
        "Guidelines:\n"
        "1. Provide a direct, clean, and comprehensive explanation in proper, complete sentences.\n"
        "2. Organize information cleanly using bold categories (e.g. **Frontend Engineering**, **Backend Engineering**, **Databases**) and clear bullet points where helpful.\n"
        "3. Never output raw document headers, page numbers (such as '--- Page 1 ---'), or raw file syntax.\n"
        "4. If the specific answer is not present in the verified context, reply exactly: "
        "'I couldn't find reliable information about this in the available company documents.'"
    )

    user_prompt = f"""
Employee Question: {query}
Employee Role: {state.get('user_role', 'Software Developer')}

Recent Conversation History:
{recent_history_str if recent_history_str else 'None'}

Verified Company Documentation Context:
{context}

Answer the employee's question directly with a clean, clear, and well-structured explanation in proper complete sentences based strictly on the verified documents above.
"""

    response = call_ollama(prompt=user_prompt, system_prompt=system_prompt, temperature=0.1, num_predict=400)

    if not response or not response.strip() or "[AI Agent is currently unavailable" in response:
        response = synthesize_clean_fallback(query=query, sources=sources, raw_context=context)

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
