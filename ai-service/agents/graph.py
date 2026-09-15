from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.router import route_intent
from agents.hr_agent import hr_agent_node
from agents.it_agent import it_agent_node
from agents.learning_agent import learning_agent_node
from agents.onboarding_agent import onboarding_agent_node

def route_decision(state: AgentState) -> str:
    assigned = state.get("assigned_agent", "hr_agent")
    return assigned

# Build the LangGraph
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("router", route_intent)
workflow.add_node("hr_agent", hr_agent_node)
workflow.add_node("it_agent", it_agent_node)
workflow.add_node("learning_agent", learning_agent_node)
workflow.add_node("onboarding_agent", onboarding_agent_node)

# Set entry point
workflow.set_entry_point("router")

# Add conditional routing edges
workflow.add_conditional_edges(
    "router",
    route_decision,
    {
        "hr_agent": "hr_agent",
        "it_agent": "it_agent",
        "learning_agent": "learning_agent",
        "onboarding_agent": "onboarding_agent"
    }
)

# Connect worker nodes to END
workflow.add_edge("hr_agent", END)
workflow.add_edge("it_agent", END)
workflow.add_edge("learning_agent", END)
workflow.add_edge("onboarding_agent", END)

# Compile Graph
agent_graph = workflow.compile()
